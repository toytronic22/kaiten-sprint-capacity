const SPRINT_MEMES = {
  ok: 'https://toytronic22.github.io/kaiten-sprint-capacity/memes/ok.png',
  fail: 'https://toytronic22.github.io/kaiten-sprint-capacity/memes/fail.png',
};

function sprintToast(text, failed, meme, stay) {
  const old = document.getElementById('sprintcap-toast');
  if (old) old.remove();
  const box = document.createElement('div');
  box.id = 'sprintcap-toast';
  box.title = 'Нажмите, чтобы закрыть';
  box.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;display:flex;flex-direction:column;align-items:center;gap:8px;max-width:min(560px,calc(100vw - 32px));cursor:pointer';
  if (meme && SPRINT_MEMES[meme]) {
    const image = document.createElement('img');
    image.src = SPRINT_MEMES[meme];
    image.alt = '';
    image.width = 300;
    image.height = 225;
    image.style.cssText = 'display:block;width:300px;max-width:100%;height:auto;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))';
    image.addEventListener('error', () => image.remove());
    box.appendChild(image);
  }
  const note = document.createElement('div');
  note.textContent = text;
  note.style.cssText = `padding:12px 16px;border-radius:10px;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;white-space:pre-line;box-shadow:0 6px 24px rgba(0,0,0,.18);color:#1f2328;background:${failed ? '#ffe1e1' : '#e6f6e8'};border:1px solid ${failed ? '#e5a3a3' : '#9fd3a7'}`;
  box.appendChild(note);
  box.addEventListener('click', () => box.remove());
  document.body.appendChild(box);
  if (!failed && !stay) window.setTimeout(() => box.remove(), 20000);
}
