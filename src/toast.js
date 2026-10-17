const sprintMeme = (emoji) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="225"><text x="150" y="165" font-size="140" text-anchor="middle">${emoji}</text></svg>`)}`;
const SPRINT_MEMES = { ok: sprintMeme('🎉'), fail: sprintMeme('🙈') };
const SPRINT_MEME_MS = 5000;
const SPRINT_TOAST_LOOKS = {
  dungeon: (failed) => `padding:12px 16px;border-radius:2px;font:17px/1.45 "Sprint Dungeon","Palatino Linotype",Palatino,Georgia,serif;white-space:pre-line;-webkit-text-stroke-width:.4px;color:${failed ? '#f2b8a6' : '#e2d8c6'};background:linear-gradient(#24211e,#121110);border:1px solid #000;box-shadow:0 0 0 1px ${failed ? '#8a3420' : '#4a4035'},0 0 0 4px #0b0a09,0 0 0 5px #2c261f,0 10px 30px rgba(0,0,0,.6)`,
  classic: (failed) => `padding:12px 16px;border-radius:10px;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;white-space:pre-line;box-shadow:0 6px 24px rgba(0,0,0,.18);color:#1f2328;background:${failed ? '#ffe1e1' : '#e6f6e8'};border:1px solid ${failed ? '#e5a3a3' : '#9fd3a7'}`,
  unicorn: (failed) => `padding:12px 18px;border-radius:20px;font:16px/1.45 "Sprint Balsamiq","Comic Sans MS","Chalkboard SE",sans-serif;white-space:pre-line;color:${failed ? '#a3264f' : '#4b3150'};background:${failed ? 'linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#ff7aa8,#ffb36b) border-box' : 'linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#ff9ec7,#ffd27a,#9fe3b4,#8fd0ff,#c5a3ff) border-box'};border:3px solid transparent;box-shadow:0 10px 28px rgba(150,70,170,.3)`,
};
let sprintToastLook = 'dungeon';

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
    window.setTimeout(() => image.remove(), SPRINT_MEME_MS);
  }
  const note = document.createElement('div');
  note.textContent = text;
  note.style.cssText = (SPRINT_TOAST_LOOKS[sprintToastLook] || SPRINT_TOAST_LOOKS.dungeon)(failed);
  box.appendChild(note);
  box.addEventListener('click', () => box.remove());
  document.body.appendChild(box);
  if (!failed && !stay) window.setTimeout(() => box.remove(), 20000);
}
