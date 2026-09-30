function kaitenError(status, path) {
  const text = status === 401 || status === 403
    ? 'Kaiten не пускает — войдите в Kaiten и нажмите ↻'
    : `Kaiten ответил ${status} на ${path}`;
  const error = new Error(text);
  error.status = status;
  return error;
}

async function kaitenJson(path, body) {
  const options = { credentials: 'include', headers: { accept: 'application/json' } };
  if (body !== undefined) {
    options.method = 'POST';
    options.headers['content-type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
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

async function kaitenCardComments(cardId) {
  const comments = await kaitenJson(`/api/cards/${cardId}/comments`);
  if (!Array.isArray(comments)) throw new Error('Kaiten вернул комментарии не списком');
  return comments;
}

async function kaitenAddComment(cardId, text) {
  return kaitenJson(`/api/cards/${cardId}/comments`, { text });
}

async function kaitenBoard(boardId) {
  return kaitenJson(`/api/boards/${boardId}`);
}

async function kaitenLocationHistory(cardId) {
  const history = await kaitenJson(`/api/cards/${cardId}/location-history`);
  if (!Array.isArray(history)) throw new Error('Kaiten вернул историю карты не списком');
  return history;
}

async function kaitenSprint(sprintId) {
  return kaitenJson(`/api/sprints/${sprintId}`);
}
