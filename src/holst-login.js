function holstLoginCopy() {
  let token = null;
  try {
    token = JSON.parse(localStorage.getItem('social-auth-store') || '{}').token;
  } catch (error) {
    token = null;
  }
  if (location.hostname !== 'app.holst.so') {
    alert('Ёмкость спринта: откройте любую доску Holst и нажмите закладку «Вход в Holst» там');
    return;
  }
  if (!token) {
    alert('Ёмкость спринта: вы не вошли в Holst — войдите и нажмите закладку ещё раз');
    return;
  }
  const done = () => alert('Вход в Holst скопирован.\nВернитесь в Kaiten, нажмите «В Holst» в панели «Ёмкость спринта» и вставьте его в поле (Cmd+V).');
  const manual = () => prompt('Браузер не дал скопировать сам. Скопируйте вход (Cmd+C) и вставьте в панель «Ёмкость спринта» в Kaiten:', token);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(token).then(done, manual);
  else manual();
}
