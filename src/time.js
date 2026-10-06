const TIME_HOST = /(^|\.)time-messenger\.ru$/;
const TIME_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?time-messenger\.ru$/;
const TIME_KAITEN = /^https:\/\/([a-z0-9-]+\.)?kaiten\.ru$/;
const TIME_HELLO_MS = 1000;

function timeChannelPlace(url) {
  let parsed = null;
  try {
    parsed = new URL(String(url || '').trim());
  } catch (error) {
    return null;
  }
  if (parsed.protocol !== 'https:' || !TIME_HOST.test(parsed.hostname)) return null;
  const match = parsed.pathname.match(/^\/([^/]+)\/channels\/([^/]+)\/?$/);
  return match ? { origin: parsed.origin, team: decodeURIComponent(match[1]), channel: decodeURIComponent(match[2]) } : null;
}

function timeCookie(name) {
  const found = String(document.cookie || '').split('; ').find((item) => item.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : '';
}

function timeError(status) {
  if (status === 401) return 'Вы не вошли в Time в этом браузере — войдите и нажмите закладку ещё раз';
  if (status === 403) return 'Time не пускает в этот канал — проверьте, что вы в нём состоите';
  if (status === 404) return 'Канал не найден — проверьте ссылку на канал в панели';
  return `Time ответил ${status}`;
}

async function timeApi(path, body) {
  const options = { credentials: 'include', headers: { accept: 'application/json', 'x-requested-with': 'XMLHttpRequest' } };
  if (body !== undefined) {
    options.method = 'POST';
    options.headers['content-type'] = 'application/json';
    options.headers['x-csrf-token'] = timeCookie('MMCSRF');
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  if (!response.ok) throw new Error(timeError(response.status));
  return response.json();
}

async function timeChannel(url) {
  const place = timeChannelPlace(url);
  if (!place) throw new Error('В панели не та ссылка на канал Time — нужна ссылка вида https://…time-messenger.ru/<команда>/channels/<канал>');
  if (place.origin !== location.origin) throw new Error(`Канал в панели — на ${place.origin}, а эта вкладка — ${location.origin}`);
  return timeApi(`/api/v4/teams/name/${encodeURIComponent(place.team)}/channels/name/${encodeURIComponent(place.channel)}`);
}

function timeHandoff() {
  if (!window.opener) {
    alert('Ёмкость спринта: откройте Time кнопкой «Открыть Time» в панели на Kaiten и нажмите закладку в той вкладке');
    return;
  }
  if (window.__sprintCapacityTime) {
    sprintToast('Связь с Kaiten уже есть — не закрывайте эту вкладку', false, null, true);
    return;
  }
  const reply = (event, message) => event.source.postMessage(message, event.origin);
  const listen = async (event) => {
    if (!TIME_KAITEN.test(event.origin) || !event.data || !event.source) return;
    if (event.data.type === 'sprint-capacity:time-ping') {
      try {
        const [me, channel] = await Promise.all([timeApi('/api/v4/users/me'), timeChannel(event.data.channel)]);
        reply(event, { type: 'sprint-capacity:time-ready', user: me.username, channel: channel.display_name || channel.name, url: event.data.channel });
      } catch (error) {
        reply(event, { type: 'sprint-capacity:time-ready', error: error.message || String(error), url: event.data.channel });
      }
    }
    if (event.data.type === 'sprint-capacity:time-send') {
      const id = event.data.id;
      try {
        const text = String(event.data.text || '').trim();
        if (!text) throw new Error('Пустое сообщение');
        const channel = await timeChannel(event.data.channel);
        await timeApi('/api/v4/posts', { channel_id: channel.id, message: text });
        const done = `Сводка отправлена в Time, канал «${channel.display_name || channel.name}»`;
        sprintToast(done, false, null, true);
        reply(event, { type: 'sprint-capacity:time-result', id, ok: true, text: done });
      } catch (error) {
        const failed = `В Time не отправилось: ${error.message || error}`;
        sprintToast(failed, true);
        reply(event, { type: 'sprint-capacity:time-result', id, ok: false, text: failed });
      }
    }
  };
  window.addEventListener('message', listen);
  const hello = () => {
    if (window.opener && !window.opener.closed) window.opener.postMessage({ type: 'sprint-capacity:time-hello' }, '*');
  };
  const timer = window.setInterval(hello, TIME_HELLO_MS);
  window.__sprintCapacityTime = () => {
    window.clearInterval(timer);
    window.removeEventListener('message', listen);
    delete window.__sprintCapacityTime;
  };
  hello();
  sprintToast('Time подключён к панели в Kaiten. Не закрывайте эту вкладку — через неё уходят сводки', false, null, true);
}
