import axios from 'axios';
import { ITask } from 'pg-promise';
import { DbGameResult, CursorObject, DbPage } from '../types';
import { db, pgp } from '../db/config';
import { dbGameResultToGameResult, validatePageResponse } from '../utils';
import config from '../utils/config';

const csGameResult = new pgp.helpers.ColumnSet<DbGameResult>(
  ['gameid', 't', 'playeraname', 'playeraplayed', 'playerbname', 'playerbplayed'],
  { table: 'gameresults' }
  );

const csCursors = new pgp.helpers.ColumnSet<CursorObject>(
  ['cursor'],
  { table: 'cursors' }
);

const onConflict = ' ON CONFLICT DO NOTHING';

/**
 * Saves new game results to db or updates in case of game result already existed: i.e. 'upsert'
 * @param data array of game results in db format
 * @returns Promise including true in success and undefined in case of error
 * @see storePage
 */
const storeGameResults = async (data: DbGameResult[]) => {
  const insertQuery = pgp.helpers.insert(data, csGameResult) + onConflict;
  try {
    await db.none(insertQuery);
    return true;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

/**
 * @param page One validated page get from Bad Api in db format
 * @returns Promise including `cursor` string if page (game results) was saved and cursor should be saved to indicate that page is saved.
 *          Promise including `false` if page was already saved and thus also all next pages are saved so stop storing next pages
 *          Promise including `undefined` in case of error.
 * @see syncBadApiAndDb
 */
 const storePage = async (page: DbPage) => {
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
      const res = await db.oneOrNone<CursorObject>('SELECT * FROM cursors WHERE cursor = $1', cursor);
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
  const insertQuery = pgp.helpers.insert(cursors, csCursors) + onConflict;
  try {
    await db.none(insertQuery);
    return true;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

/**
 * Is used to recursively synch `Bad Api` json pages with Postgres database
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
    const result = await db.any<DbGameResult>(`
      SELECT * FROM gameResults WHERE playeraname = $1 OR playerbname = $1
      ORDER BY t DESC
      LIMIT $2
      OFFSET $3
      `,
      [player, pageSize, offset]
    );
    return result.map(dbGameResultToGameResult);
  } catch (e) {
    console.log(e);
    return { error: 'Oops, something went wrong' };
  }
};

/**
 * @param player player's name
 * @returns Promise including number that indicates how many pages there exists for `player`
 *          or error message in case of error
 */
export const getPlayerPageCount = async (player: string) => {
  try {
    const res = await db.one<{ count: string}>('SELECT COUNT(*) FROM gameResults WHERE playeraname = $1 OR playerbname = $1', player);
    return Math.ceil(Number(res.count) / pageSize);
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
  try {
    const res = await db.any<{ player: string }>(`
      SELECT DISTINCT playerAname AS player FROM gameResults
        UNION
      SELECT DISTINCT playerBname AS player FROM gameResults;
      `);
    return res.map((obj) => obj.player);
  } catch (e) {
    console.log(e);
    return { error: 'Oops, something went wrong' };
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
export const getPlayerSummary = (player: string) => {
  return db.task(async (t) => {
    const winRatioP = getWinratio(t, player);
    const totalGamesP = getTotalMatchedPlayed(t, player);
    const mostPlayedHandP = getMostPlayedHand(t, player);
    return Promise.all([winRatioP, totalGamesP, mostPlayedHandP])
      .then((values) => {
        return {
          winRatio: values[0],
          totalGames: values[1],
          mostPlayedHand: values[2]
        };
      })
      .catch((e) => {
        console.log(e);
        return undefined;
      });
  });
};

/**
 * @param player player's name
 * @returns `player`'s most played hand or undefined in case of error
 */
const getMostPlayedHand = async (t: ITask<Record<string, unknown>>, player: string) => {
  try {
    const res = await t.oneOrNone<{ played: string, count: number }>(`
      SELECT A.played, A.playedcount + B.playedCount AS count
      FROM
      (
        SELECT playeraplayed AS played, COUNT(*) AS playedcount FROM gameresults
        WHERE playeraname = $1
        GROUP BY playeraplayed
        ORDER BY count(*) DESC
      ) AS A,
      (
        SELECT playerbplayed AS played, COUNT(*) AS playedcount FROM gameresults
        WHERE playerbname = $1
        GROUP BY playerbplayed
        ORDER BY count(*) DESC
      ) AS B
      WHERE A.played = B.played
      ORDER BY count DESC
      LIMIT 1
      `,
      player);
    return res?.played;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

/**
 * @param player player's name
 * @returns number of player has played or undefined in case of error
 */
const getTotalMatchedPlayed = async (t: ITask<Record<string, unknown>>, player: string) => {
  try {
    const res = await t.oneOrNone<{ totalgames: number }>(`
      SELECT COUNT(*) AS totalgames FROM gameresults
      WHERE playeraname = $1 or playerbname = $1
      `,
      player);
    return Number(res?.totalgames);
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
const getWinratio = async (t: ITask<Record<string, unknown>>, player: string) => {
  try {
    const res = await t.one<{ winratio: number }>(`
      SELECT A.WINS / NULLIF(A.TOTALGAMES, 0) as winratio
      FROM
      (
      SELECT
        (
          SELECT CAST(COUNT(*) AS FLOAT) AS WINS FROM (
            SELECT * FROM (
              SELECT * FROM gameresults
              WHERE playeraname = $1
            ) AS AGAMES
            WHERE (playeraplayed = 'PAPER' AND playerbplayed = 'ROCK') OR (playeraplayed = 'ROCK' AND playerbplayed = 'SCISSORS') OR (playeraplayed = 'SCISSORS' AND playerbplayed = 'PAPER')
        
            UNION
        
            SELECT * FROM (
              SELECT * FROM gameresults
              WHERE playerbname = $1
            ) AS BGAMES
            WHERE (playerbplayed = 'PAPER' AND playeraplayed = 'ROCK') OR (playerbplayed = 'ROCK' AND playeraplayed = 'SCISSORS') OR (playerbplayed = 'SCISSORS' AND playeraplayed = 'PAPER')
          ) AS WINNEDGAMES
        ),
        (
          SELECT CAST(COUNT(*) AS FLOAT) AS TOTALGAMES  FROM gameresults
          WHERE playeraname = $1 or playerbname = $1
        )
      ) AS A
      `,
      player);
      return res?.winratio;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};
