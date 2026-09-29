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

function kaitenBoard(boardId) {
  return kaitenJson(`/api/boards/${boardId}?exclude_paths=lanes,cards`);
}

function kaitenSprint(id) {
  return kaitenJson(`/api/sprints/${id}`);
}

async function kaitenSprintHead(id) {
  const path = `/api/sprints/${id}`;
  const response = await fetch(path, { credentials: 'include', headers: { accept: 'application/json' } });
  if (!response.ok) throw kaitenError(response.status, path);
  if (!response.body || !response.body.getReader) return response.json();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let lookForHead = true;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    if (!lookForHead) continue;
    const result = sprintHeadFrom(text);
    if (result.found && result.head) {
      reader.cancel().catch(() => {});
      return result.head;
    }
    if (result.found) lookForHead = false;
  }
  return JSON.parse(text + decoder.decode());
}

async function mapLimited(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function kaitenLocationRecords(cards) {
  const outcomes = await mapLimited(cards, 6, (card) => kaitenJson(`/api/cards/${card.id}/location-history`)
    .then((records) => ({ records: Array.isArray(records) ? records : [] }))
    .catch((error) => ({ error })));
  const failed = outcomes.filter((outcome) => outcome.error);
  if (cards.length && failed.length === cards.length) throw failed[0].error;
  return outcomes.flatMap((outcome) => outcome.records || []);
}

async function resolveSprints(cards, config, now) {
  const currentId = currentSprintId(cards);
  const current = currentId === null ? null : await kaitenSprintHead(currentId);
  const plan = previousSprintPlan(currentId, current, now);
  const below = plan.source === 'history' ? plan.below : null;
  let previousId = plan.source === 'current' ? plan.id : null;
  if (plan.source === 'history') {
    const startedAt = current ? Date.parse(current.created) : Infinity;
    const candidates = cards.filter((card) => !(Date.parse(card.created) >= startedAt));
    previousId = latestSprintId(await kaitenLocationRecords(candidates), config.boardId, below);
  }
  let previous = previousId === null ? null : await kaitenSprint(previousId);
  for (let step = 0; previous && step < 3; step += 1) {
    const newer = newerSprintInUpdates(previous, config.boardId, below);
    if (newer === null) break;
    previous = await kaitenSprint(newer);
  }
  return { current: plan.source === 'current' ? null : current, closing: plan.source === 'current' ? current : null, previous };
}
