"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerSummary = exports.getAllPlayers = exports.getPlayerPageCount = exports.getPlayerHistory = exports.syncBadApiAndDb = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const utils_1 = require("../utils/");
const Cursor_1 = __importDefault(require("../models/Cursor"));
const GameResult_1 = __importDefault(require("../models/GameResult"));
const config_1 = __importDefault(require("../utils/config"));
/**
 * Saves new game results to db or updates in case of game result already existed: i.e. 'upsert'
 * @param data array of game results
 * @returns Promise including true in success and undefined in case of error
 * @see storePage
 */
const storeGameResults = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield GameResult_1.default.bulkWrite(data.map((result) => ({
            updateOne: {
                filter: { gameId: result.gameId },
                update: result,
                upsert: true,
            }
        })));
        return true;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
});
/**
 *
 * @param page One validated page get from Bad Api
 * @returns Promise including `cursor` string if page (game results) was saved and cursor should be saved to indicate that page is saved.
 *          Promise including `false` if page was already saved and thus also all next pages are saved so stop storing next pages
 *          Promise including `undefined` in case of error.
 * @see syncBadApiAndDb
 */
const storePage = (page) => __awaiter(void 0, void 0, void 0, function* () {
    if (!page.cursor || (yield pageIsSaved(page.cursor))) {
        return false;
    }
    else {
        const res = yield storeGameResults(page.data);
        if (res) {
            return page.cursor;
        }
        return res;
    }
});
/**
 *
 * @param cursor `cursor` string of page (this means cursor to next page, i.e. one use next page cursor to indicate whether current page is saved or not)
 * @returns Boolean promise indicating whether page is saved or not
 * @see storePage
 */
const pageIsSaved = (cursor) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield Cursor_1.default.exists({ cursor: cursor });
        if (res) {
            return true;
        }
        else
            return false;
    }
    catch (e) {
        console.log(e);
        return false; // perform saving/upsert to be sure that game results are saved
    }
});
/**
 * Stores cursors to db to indicate that these page where that cursor is present is saved
 * @param cursor `CursorObject array` containing cursors which needs to be saved
 * @returns Promise including true in case of success and undefined in case of error.
 * @see syncBadApiAndDb
 */
const storeCursors = (cursors) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Cursor_1.default.insertMany(cursors);
        return true;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
});
/**
 * Is used to recursively synch `Bad Api` json pages with MongoDB database
 * Pages are saved until cursors to next page tells that this page is already saved
 * Cursors of saved page are stored to array and finally if no error occured, all cursors are saved
 * This way one ensure that all pages will be in sync with api and no 'page holes' are present due to error
 * @returns textual description of outcome
 */
const syncBadApiAndDb = () => __awaiter(void 0, void 0, void 0, function* () {
    const apiBaseUrl = 'https://bad-api-assignment.reaktor.com';
    let path = '/rps/history';
    let counter = 0;
    let result = 'sync success';
    const cursors = [];
    let error = false;
    while (path) {
        const response = yield axios_1.default
            .get(`${apiBaseUrl}${path}`);
        const page = (0, utils_1.validatePageResponse)(response.data);
        if (page) {
            path = page.cursor;
            const res = yield storePage(page);
            if (res === false) {
                // stop fetching
                console.log('aborting sync');
                path = undefined;
                break;
            }
            else if (res === undefined) {
                error = true;
                path = undefined;
                result = 'sync failed due to error';
                break;
            }
            else if (counter > 0 && page.cursor) {
                // store cursor so it can be saved later on
                // the first cursor is not stored
                cursors.push({ cursor: page.cursor });
            }
        }
        counter++;
    }
    // when success store cursors
    if (!error && cursors.length > 0) {
        yield storeCursors(cursors);
    }
    return result;
});
exports.syncBadApiAndDb = syncBadApiAndDb;
/**
 * Number of game results per page
 */
const pageSize = config_1.default.PAGE_SIZE;
/**
 *
 * @param player player's name
 * @param page number of page to get history data, paging is starting from 0
 * @returns Promise including array of game results or error message
 * @see pageSize
 */
const getPlayerHistory = (player, page) => __awaiter(void 0, void 0, void 0, function* () {
    const offset = pageSize * page;
    try {
        const res = yield GameResult_1.default.find({ $or: [{ 'playerA.name': player }, { 'playerB.name': player }] }, {}, { sort: { t: -1 }, skip: offset, limit: pageSize });
        return res.map(o => o.toJSON());
    }
    catch (e) {
        console.log(e);
        return { error: 'Oops, something went wrong' };
    }
});
exports.getPlayerHistory = getPlayerHistory;
/**
 *
 * @param player player's name
 * @returns Promise including number that indicates how many pages there exists for `player`
 *          or error message in case of error
 */
const getPlayerPageCount = (player) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield GameResult_1.default.countDocuments({ $or: [{ 'playerA.name': player }, { 'playerB.name': player }] });
        return Math.ceil(Number(res) / pageSize);
    }
    catch (e) {
        console.log(e);
        return { error: 'Oops, something went wrong' };
    }
});
exports.getPlayerPageCount = getPlayerPageCount;
/**
 *
 * @returns All distinct playernames in db
 *          or error message in case of error
 */
const getAllPlayers = () => __awaiter(void 0, void 0, void 0, function* () {
    const errorRes = { error: 'Oops, something went wrong' };
    try {
        const anames = yield GameResult_1.default.distinct('playerA.name').exec();
        const bnames = yield GameResult_1.default.distinct('playerB.name').exec();
        if ((0, types_1.isStringArray)(anames) && (0, types_1.isStringArray)(bnames)) {
            return [...new Set(anames.concat(bnames))];
        }
        return errorRes;
    }
    catch (e) {
        console.log(e);
        return errorRes;
    }
});
exports.getAllPlayers = getAllPlayers;
/**
 * Wraps all summary info functions and returns result in combined object
 * @param player player's name
 * @returns `player`'s summary containing WinRatio, totalGames played and mostPlayedHand
 * @see getMostPlayedHand
 * @see getTotalMatchedPlayed
 * @see getWinratio
 */
const getPlayerSummary = (player) => __awaiter(void 0, void 0, void 0, function* () {
    const hand = getMostPlayedHand(player);
    const games = getTotalMatchedPlayed(player);
    const ratio = getWinratio(player);
    return {
        winRatio: yield ratio,
        totalGames: yield games,
        mostPlayedHand: yield hand
    };
});
exports.getPlayerSummary = getPlayerSummary;
/**
 *
 * @param player player's name
 * @returns `player`'s most played hand or undefined in case of error
 */
const getMostPlayedHand = (player) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aplayed = yield GameResult_1.default.aggregate([
            {
                $match: { 'playerA.name': player },
            },
            {
                $group: {
                    _id: '$playerA.played',
                    count: { $sum: 1 }
                }
            }
        ]);
        const bplayed = yield GameResult_1.default.aggregate([
            {
                $match: { 'playerB.name': player },
            },
            {
                $group: {
                    _id: '$playerB.played',
                    count: { $sum: 1 }
                }
            }
        ]);
        const [validatedA, validatedB] = [(0, utils_1.validateMostPlayedHandResponse)(aplayed), (0, utils_1.validateMostPlayedHandResponse)(bplayed)];
        if (validatedA && validatedB) {
            const rockA = validatedA.find((el) => el._id === 'ROCK');
            const rockB = validatedB.find((el) => el._id === 'ROCK');
            const scissorsA = validatedA.find((el) => el._id === 'SCISSORS');
            const scissorsB = validatedB.find((el) => el._id === 'SCISSORS');
            const paperA = validatedA.find((el) => el._id === 'PAPER');
            const paperB = validatedB.find((el) => el._id === 'PAPER');
            const rock = rockA && rockB ? rockA.count + rockB.count : 0;
            const scissors = scissorsA && scissorsB ? scissorsA.count + scissorsB.count : 0;
            const paper = paperA && paperB ? paperA.count + paperB.count : 0;
            if (rock > scissors && rock > paper)
                return types_1.Played.Rock;
            else if (scissors > rock && scissors > paper)
                return types_1.Played.Scissors;
            else
                return types_1.Played.Paper;
        }
        return undefined;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
});
/**
 *
 * @param player player's name
 * @returns number of player has played or undefined in case of error
 */
const getTotalMatchedPlayed = (player) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield GameResult_1.default.countDocuments({ $or: [{ 'playerA.name': player }, { 'playerB.name': player }] });
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
});
/**
 *
 * @param player player's name
 * @returns `player`'s win ratio or undefined if error occured
 */
const getWinratio = (player) => __awaiter(void 0, void 0, void 0, function* () {
    const totalGames = yield getTotalMatchedPlayed(player);
    try {
        const wins = yield GameResult_1.default.countDocuments({
            $or: [
                {
                    $and: [
                        { 'playerA.name': player },
                        { $or: [
                                {
                                    $and: [{ 'playerA.played': 'PAPER' }, { 'playerB.played': 'ROCK' }]
                                },
                                {
                                    $and: [{ 'playerA.played': 'ROCK' }, { 'playerB.played': 'SCISSORS' }]
                                },
                                {
                                    $and: [{ 'playerA.played': 'SCISSORS' }, { 'playerB.played': 'PAPER' }]
                                }
                            ]
                        },
                    ]
                },
                {
                    $and: [
                        { 'playerB.name': player },
                        { $or: [
                                {
                                    $and: [{ 'playerB.played': 'PAPER' }, { 'playerA.played': 'ROCK' }]
                                },
                                {
                                    $and: [{ 'playerB.played': 'ROCK' }, { 'playerA.played': 'SCISSORS' }]
                                },
                                {
                                    $and: [{ 'playerB.played': 'SCISSORS' }, { 'playerA.played': 'PAPER' }]
                                }
                            ]
                        },
                    ]
                }
            ]
        });
        if (totalGames) {
            return wins * 1.0 / totalGames;
        }
        return undefined;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
});
