import axios from 'axios';
import { GameResult, CursorObject, Page, isStringArray, Played } from '../types';
import { validateMostPlayedHandResponse, validatePageResponse } from '../utils/';
import CursorModel from '../models/Cursor';
import GameResultModel from '../models/GameResult';
import config from '../utils/config';

/**
 * Saves new game results to db or updates in case of game result already existed: i.e. 'upsert'
 * @param data array of game results
 * @returns Promise including true in success and undefined in case of error
 * @see storePage
 */
const storeGameResults = async (data: GameResult[]) => {
  try {
    await GameResultModel.bulkWrite(data.map((result) => ({
      updateOne: {
        filter: { gameId: result.gameId },
        update: result,
        upsert: true,
      }
    })));
    return true;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

/**
 * 
 * @param page One validated page get from Bad Api
 * @returns Promise including `cursor` string if page (game results) was saved and cursor should be saved to indicate that page is saved.
 *          Promise including `false` if page was already saved and thus also all next pages are saved so stop storing next pages
 *          Promise including `undefined` in case of error.
 * @see syncBadApiAndDb
 */
 const storePage = async (page: Page) => {
   if (!page.cursor || await pageIsSaved(page.cursor)) {
     return false;
   } else {
     const res = await storeGameResults(page.data);
     if (res) {
       return page.cursor;
     }
     return res;
   }
};

/**
 * 
 * @param cursor `cursor` string of page (this means cursor to next page, i.e. one use next page cursor to indicate whether current page is saved or not)
 * @returns Boolean promise indicating whether page is saved or not
 * @see storePage
 */
const pageIsSaved = async (cursor: string) => {
  try {
      const res = await CursorModel.exists({ cursor: cursor});
    if (res) {
      return true;
    } else return false;
  } catch (e) {
    console.log(e);
    return false; // perform saving/upsert to be sure that game results are saved
  }
};

/**
 * Stores cursors to db to indicate that these page where that cursor is present is saved
 * @param cursor `CursorObject array` containing cursors which needs to be saved
 * @returns Promise including true in case of success and undefined in case of error.
 * @see syncBadApiAndDb
 */
const storeCursors = async (cursors: CursorObject[]) => {
  try {
    await CursorModel.insertMany(cursors);
    return true;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

/**
 * Is used to recursively synch `Bad Api` json pages with MongoDB database
 * Pages are saved until cursors to next page tells that this page is already saved
 * Cursors of saved page are stored to array and finally if no error occured, all cursors are saved
 * This way one ensure that all pages will be in sync with api and no 'page holes' are present due to error
 * @returns textual description of outcome
 */
export const syncBadApiAndDb =async () => {
  const apiBaseUrl = 'https://bad-api-assignment.reaktor.com';
  let path: string | undefined = '/rps/history';
  let counter = 0;
  let result = 'sync success';
  const cursors: CursorObject[] = [];
  let error = false;

  while (path) {
    const response = await axios
      .get(`${apiBaseUrl}${path}`);

    const page = validatePageResponse(response.data);

    if (page) {
      path = page.cursor;
      const res = await storePage(page);
      if (res === false) {
        // stop fetching
        console.log('aborting sync');
        path = undefined;
        break;
      } else if (res === undefined) {
        error = true;
        path = undefined;
        result = 'sync failed due to error';
        break;
      } else if (counter > 0 && page.cursor) {
          // store cursor so it can be saved later on
          // the first cursor is not stored
          cursors.push({ cursor: page.cursor });
      }
    }
    counter++;
  }

  // when success store cursors
  if (!error && cursors.length > 0) {
    await storeCursors(cursors);
  }

  return result;
};

/**
 * Number of game results per page
 */
const pageSize = config.PAGE_SIZE;

/**
 * 
 * @param player player's name
 * @param page number of page to get history data, paging is starting from 0
 * @returns Promise including array of game results or error message
 * @see pageSize
 */
export const getPlayerHistory = async (player: string, page: number) => {
  const offset = pageSize * page;
  try {
    const res = await GameResultModel.find(
      { $or: [{ 'playerA.name': player }, { 'playerB.name': player }] },
      {},
      { sort: { t: -1 }, skip: offset, limit: pageSize }
    );
    return res.map(o => o.toJSON());
  } catch (e) {
    console.log(e);
    return { error: 'Oops, something went wrong' };
  }
};

/**
 * 
 * @param player player's name
 * @returns Promise including number that indicates how many pages there exists for `player`
 *          or error message in case of error
 */
export const getPlayerPageCount = async (player: string) => {
  try {
    const res = await GameResultModel.countDocuments({ $or: [{ 'playerA.name': player }, { 'playerB.name': player }] });
    return Math.ceil(Number(res) / pageSize);
  } catch (e) {
    console.log(e);
    return { error: 'Oops, something went wrong' };
  }
};

/**
 * 
 * @returns All distinct playernames in db
 *          or error message in case of error
 */
export const getAllPlayers = async () => {
  const errorRes = { error: 'Oops, something went wrong' };
  try {
    const anames = await GameResultModel.distinct('playerA.name').exec();
    const bnames = await GameResultModel.distinct('playerB.name').exec();

    if (isStringArray(anames) && isStringArray(bnames)) {
      return [...new Set(anames.concat(bnames))];
    }
    return errorRes;
  } catch (e) {
    console.log(e);
    return errorRes;
  }
};

/**
 * Wraps all summary info functions and returns result in combined object
 * @param player player's name
 * @returns `player`'s summary containing WinRatio, totalGames played and mostPlayedHand
 * @see getMostPlayedHand
 * @see getTotalMatchedPlayed
 * @see getWinratio
 */
export const getPlayerSummary = async (player: string) => {
  const hand = getMostPlayedHand(player);
  const games = getTotalMatchedPlayed(player);
  const ratio = getWinratio(player);
  return {
    winRatio: await ratio,
    totalGames: await games,
    mostPlayedHand: await hand
  };
};

/**
 * 
 * @param player player's name
 * @returns `player`'s most played hand or undefined in case of error
 */
const getMostPlayedHand = async (player: string) => {
  
  try {
    const aplayed = await GameResultModel.aggregate([
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
    const bplayed = await GameResultModel.aggregate([
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

    const [validatedA, validatedB] = [validateMostPlayedHandResponse(aplayed), validateMostPlayedHandResponse(bplayed)];

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
      
      if (rock > scissors && rock > paper) return Played.Rock;
      else if (scissors > rock && scissors > paper) return Played.Scissors;
      else return Played.Paper;
    }
    
    return undefined;

  } catch (e) {
    console.log(e);
    return undefined;
  }
};

/**
 * 
 * @param player player's name
 * @returns number of player has played or undefined in case of error
 */
const getTotalMatchedPlayed = async (player: string) => {
  try {
    return await GameResultModel.countDocuments({ $or: [{ 'playerA.name': player }, { 'playerB.name': player }] });
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

/**
 * 
 * @param player player's name
 * @returns `player`'s win ratio or undefined if error occured
 */
const getWinratio = async (player: string) => {
  const totalGames = await getTotalMatchedPlayed(player);

  try {
    const wins = await GameResultModel.countDocuments(
      { 
        $or: [
          {
            $and: [
              { 'playerA.name': player },
              { $or: [
                  { 
                    $and: [ {'playerA.played': 'PAPER' }, {'playerB.played': 'ROCK' } ] 
                  }, 
                  { 
                    $and: [ {'playerA.played': 'ROCK' }, {'playerB.played': 'SCISSORS' } ]
                  },
                  { 
                    $and: [ {'playerA.played': 'SCISSORS' }, {'playerB.played': 'PAPER' } ]
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
                    $and: [ {'playerB.played': 'PAPER' }, {'playerA.played': 'ROCK' } ] 
                  }, 
                  { 
                    $and: [ {'playerB.played': 'ROCK' }, {'playerA.played': 'SCISSORS' } ]
                  },
                  { 
                    $and: [ {'playerB.played': 'SCISSORS' }, {'playerA.played': 'PAPER' } ]
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
  } catch (e) {
    console.log(e);
    return undefined;
  }
};
