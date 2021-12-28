import { Router } from 'express';
import {
  getAllPlayers,
  getPlayerHistory,
  getPlayerPageCount,
  getPlayerSummary,
} from '../services/historyDataService';
import { isString } from '../types';

const historyDataRouter = Router();

/**
 * Get player's history of played games
 * Query param `player` is player's name
 * Query param `page` is page number which results are retrieved
 * 
 * @returns json array containing history data or error message if error occured
 */
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

/**
 * Get number of history pages for certain player
 * Query param `player` defines player's name
 * 
 * @returns number of pages or error message is error occured
 */
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

/**
 * Get all distinct player names from db
 * @returns json array of distinct player names whose result are stored to db
 *          or error message in case of error
 */
historyDataRouter.get('/players', (_req, res) => {
  getAllPlayers()
    .then((result) => res.json(result))
    .catch((e) => {
      console.log(e);
      res.json({ error: 'Oops, something went wrong' });
    });
});

/**
 * Get player's summary info
 * url param `player` is player's name
 * @returns json object containing:
 *          `winRatio: float`
 *          `totalGames: int`
 *          `mostPlayedHand: Played`
 *          if one info value can't be calculated undefined is returned for that key
 *          or error message in case of error
 *          
 */
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
