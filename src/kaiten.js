function kaitenError(status, path) {
  const text = status === 401 || status === 403
    ? 'Kaiten не пускает — войдите в Kaiten и нажмите «Обновить»'
    : `Kaiten ответил ${status} на ${path}`;
  const error = new Error(text);
  error.status = status;
  return error;
}

async function kaitenJson(path) {
  const response = await fetch(path, { credentials: 'include', headers: { accept: 'application/json' } });
  if (!response.ok) throw kaitenError(response.status, path);
  return response.json();
}

async function kaitenBoardCards(boardId) {
  const cards = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const page = await kaitenJson(`/api/cards?board_id=${boardId}&condition=1&limit=100&offset=${offset}`);
    if (!Array.isArray(page)) throw new Error('Kaiten вернул карты не списком');
    cards.push(...page);
    if (page.length < 100) return cards;
  }
  throw new Error('На доске больше 5000 карт — остановился');
}
