const HOLST_ORIGIN = 'https://app.holst.so';
const HOLST_KAITEN = /^https:\/\/([a-z0-9-]+\.)?kaiten\.ru$/;
const HOLST_HANDOFF_MS = 2500;
const HOLST_RESULT_MS = 120000;

function holstBrowserToken() {
  try {
    const token = JSON.parse(localStorage.getItem('social-auth-store') || '{}').token;
    return typeof token === 'string' && token ? token : null;
  } catch (error) {
    return null;
  }
}

function holstLoginCopy(token) {
  const done = () => alert('Вход в Holst скопирован.\nВ Kaiten в панели «Ёмкость спринта» нажмите красную точку вверху → «Вставить вход вручную» и вставьте его (Cmd+V, на Windows — Ctrl+V).');
  const manual = () => prompt('Браузер не дал скопировать сам. Скопируйте вход (Cmd+C, на Windows — Ctrl+C), в Kaiten в панели «Ёмкость спринта» нажмите красную точку вверху → «Вставить вход вручную» и вставьте:', token);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(token).then(done, manual);
  else manual();
}

function holstHandoff() {
  if (location.hostname !== 'app.holst.so') {
    alert('Ёмкость спринта: откройте Kaiten и нажмите закладку «Ёмкость спринта» там');
    return;
  }
  const token = holstBrowserToken();
  if (!token) {
    alert('Ёмкость спринта: вы не вошли в Holst — войдите и нажмите закладку ещё раз');
    return;
  }
  if (!window.opener) {
    holstLoginCopy(token);
    return;
  }
  if (window.__sprintCapacityHandoff) window.__sprintCapacityHandoff();
  let sent = false;
  let timer = null;
  const stop = () => {
    window.clearTimeout(timer);
    window.removeEventListener('message', listen);
    delete window.__sprintCapacityHandoff;
  };
  const listen = (event) => {
    if (!HOLST_KAITEN.test(event.origin) || !event.data || !event.source) return;
    if (event.data.type === 'sprint-capacity:ping' && !sent) {
      sent = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(stop, HOLST_RESULT_MS);
      event.source.postMessage({ type: 'sprint-capacity:login', token }, event.origin);
      sprintToast('Вход в Holst передан в Kaiten', false, null, true);
    }
    if (event.data.type === 'sprint-capacity:result' && sent) {
      const failed = Boolean(event.data.failed);
      sprintToast(String(event.data.text), failed, event.data.meme ? (failed ? 'fail' : 'ok') : null);
      stop();
    }
  };
  window.addEventListener('message', listen);
  window.__sprintCapacityHandoff = stop;
  timer = window.setTimeout(() => {
    stop();
    holstLoginCopy(token);
  }, HOLST_HANDOFF_MS);
  window.opener.postMessage({ type: 'sprint-capacity:hello' }, '*');
}
