import { Router } from 'express';
import {
  deleteAllCursors,
  getAllPlayers,
  getCursors,
  getPlayerHistory,
  getPlayerPageCount,
  getPlayerSummary,
  syncBadApiAndDb
} from '../services/historyDataService';
import { isString } from '../types';

const historyDataRouter = Router();


// FOR DEVELOPMENT ONLY
historyDataRouter.get('/initdb', (_req, res) => {
  syncBadApiAndDb()
    .then((result) => res.send(result))
    .catch((e) => res.send(e));

  /* const baseUrl = 'https://bad-api-assignment.reaktor.com';
  let path: string | undefined = '/rps/history';
  let counter = 0;

  while (path) {
    const response = await axios
      .get<Page>(`${baseUrl}${path}`);

    const page: Page = response.data;

    if (page) {
      path = page.cursor;
      const res = await savePage(page, counter);
      if (res === undefined) {
        // stop fetching
        console.log('aborting');
        path = undefined;
      }
    }

    counter++;
  }

  console.log('read ', counter);
  res.json(counter); */
});

// FOR DEVELOPMENT PURPOSES ONLY
historyDataRouter.get('/deleteCursors', (_req, res) => {
  deleteAllCursors()
    .then(() => res.send('deleted'))
    .catch((e) => {
      console.log(e);
      res.json({ error: 'Oops, something went wrong' });
    });
});

historyDataRouter.get('/cursors', (_req, res) => {
  getCursors()
    .then((result) => res.json(result))
    .catch((e) => {
      console.log(e);
      res.json({ error: 'Oops, something went wrong' });
    });
});

historyDataRouter.get('/', (req, res) => {
  const player = req.query.player;
  const pageNumber = Number(req.query.page);

  console.log(req.query);

  if (isString(player) && !isNaN(pageNumber)) {
    const decodedPlayer = decodeURIComponent(player);

    getPlayerHistory(decodedPlayer, pageNumber)
      .then((data) => res.json(data))
      .catch((e) => {
        console.log(e);
        res.json({ error: 'Oops, something went wrong' });
      });
  }
  else {
    res.json({ error: 'Invalid query params'});
  }
  
});

historyDataRouter.get('/pagecount', (req, res) => {
  const player = req.query.player;

  if (isString(player)) {
    const decodedPlayer = decodeURIComponent(player);

    getPlayerPageCount(decodedPlayer)
      .then((pages) => res.json(pages))
      .catch((e) => {
        console.log(e);
        res.json({ error: 'Oops, something went wrong' });
      });
  }
  else {
    res.json({ error: 'Invalid query params'});
  }
});

historyDataRouter.get('/players', (_req, res) => {
  getAllPlayers()
    .then((result) => res.json(result))
    .catch((e) => {
      console.log(e);
      res.json({ error: 'Oops, something went wrong' });
    });
});

historyDataRouter.get('/summary/:player', (req, res) => {
  const player = req.params.player;
  getPlayerSummary(player)
    .then((result) => res.json(result))
    .catch((e) => {
      console.log(e);
      res.json({ error: 'Oops, something went wrong' });
    });
    
});



export default historyDataRouter;
