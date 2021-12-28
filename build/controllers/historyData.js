"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const historyDataService_1 = require("../services/historyDataService");
const types_1 = require("../types");
const historyDataRouter = (0, express_1.Router)();
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
    if ((0, types_1.isString)(player) && !isNaN(pageNumber)) {
        const decodedPlayer = decodeURIComponent(player);
        (0, historyDataService_1.getPlayerHistory)(decodedPlayer, pageNumber)
            .then((data) => res.json(data))
            .catch((e) => {
            console.log(e);
            res.json({ error: 'Oops, something went wrong' });
        });
    }
    else {
        res.json({ error: 'Invalid query params' });
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
    if ((0, types_1.isString)(player)) {
        const decodedPlayer = decodeURIComponent(player);
        (0, historyDataService_1.getPlayerPageCount)(decodedPlayer)
            .then((pages) => res.json(pages))
            .catch((e) => {
            console.log(e);
            res.json({ error: 'Oops, something went wrong' });
        });
    }
    else {
        res.json({ error: 'Invalid query params' });
    }
});
/**
 * Get all distinct player names from db
 * @returns json array of distinct player names whose result are stored to db
 *          or error message in case of error
 */
historyDataRouter.get('/players', (_req, res) => {
    (0, historyDataService_1.getAllPlayers)()
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
    (0, historyDataService_1.getPlayerSummary)(player)
        .then((result) => res.json(result))
        .catch((e) => {
        console.log(e);
        res.json({ error: 'Oops, something went wrong' });
    });
});
exports.default = historyDataRouter;
