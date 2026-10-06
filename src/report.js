const REPORT_PARALLEL = 6;
const REPORT_RETRIES = 3;

async function reportRetry(work) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      const passing = !error.status || error.status === 429 || error.status >= 500;
      if (!passing || attempt >= REPORT_RETRIES) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function reportPool(items, work, progress) {
  const results = new Array(items.length);
  let next = 0;
  let finished = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await reportRetry(() => work(items[index]));
      finished += 1;
      if (progress) progress(finished, items.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(REPORT_PARALLEL, items.length) }, worker));
  return results;
}

async function reportLoad(sprint, progress, cfg = REPORT_CONFIG) {
  const period = reportPeriod(sprint);
  const since = encodeURIComponent(new Date(period.previousStart).toISOString());
  progress('Загружаю карточки…');
  const cards = {};
  for (const board of Object.keys(cfg.boards)) Object.assign(cards, await reportRetry(() => kaitenCards(`board_id=${board}&updated_after=${since}`)));
  const bugCards = await reportRetry(() => kaitenCards(`type_ids=${cfg.bugType}&space_id=${cfg.space}&updated_after=${since}`));
  const ids = [...new Set([...Object.keys(cards), ...Object.keys(bugCards)].map(Number))];
  const lists = await reportPool(ids, (id) => kaitenLocationHistory(id), (done, total) => progress(`Читаю историю карточек: ${done} из ${total}`));
  const histories = Object.fromEntries(ids.map((id, index) => [id, lists[index]]));
  progress('Читаю колонки досок…');
  const boardIds = [...new Set(lists.flat().map((event) => event.board_id))];
  const boards = await reportPool(boardIds, (id) => kaitenBoard(id).catch((error) => {
    if (error.status === 403 || error.status === 404) return null;
    throw error;
  }));
  const columns = Object.assign({}, ...boards.map((board) => holstColumns(board)));
  return { cards, bugCards, histories, columns, period };
}

function reportBuild(loaded, sprint, cfg = REPORT_CONFIG) {
  const { period, ...data } = loaded;
  const current = reportSummarize({ ...data, start: period.start, end: period.end, cfg });
  const previous = reportSummarize({ ...data, start: period.previousStart, end: period.start, cfg });
  return { current, previous, text: reportText({ sprint, current, previous, cfg }) };
}
