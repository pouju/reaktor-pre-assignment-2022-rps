import { DbGameResult, CursorObject, DbPage, isCursorObjectArray } from '../types';
import { db, pgp } from '../db/config';
import axios from 'axios';
import { dbGameResultToGameResult, validatePageResponse } from '../utils';
import { ITask } from 'pg-promise';

const cs = new pgp.helpers.ColumnSet<DbGameResult>(
  ['gameid', 't', 'playeraname', 'playeraplayed', 'playerbname', 'playerbplayed'],
  { table: 'gameresults' }
  );

const csCursors = new pgp.helpers.ColumnSet<CursorObject>(
  ['cursor'],
  { table: 'cursors' }
);

const onConflict = ' ON CONFLICT DO NOTHING';

/**
 * 
 * @param data array of game results in db format
 * @returns Promise including true in success and undefined in case of error
 */
const storeGameResults = async (data: DbGameResult[]) => {
  const insertQuery = pgp.helpers.insert(data, cs) + onConflict;
  try {
    await db.none(insertQuery);
    return true;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

/**
 * 
 * @param page page in db format
 * @returns Promise including `cursor` string if page was saved and cursor should be saved to indicate that page is saved.
 *          Promise including `false` if page was already saved and thus also all next pages are saved so stop storing next pages
 *          Promise including `undefined` in case of error.
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
/* const storePage = async (page: DbPage, saveCursor: number) => {
  // always save first page but do not save cursor yet
  if (saveCursor === 0) {
    return await storeGameResults(page.data);
  }

  // "full" pages i.e. from second page -->
  if (page.cursor && await storeCursor(page.cursor)) {
    return await storeGameResults(page.data);
  }

  return false;
}; */

/**
 * 
 * @param cursor `cursor` string of page (this means cursor to next page, i.e. one use next page cursor to indicate whether current page is saved or not)
 * @returns Boolean promise indicating whether page is saved or not
 */
const pageIsSaved = async (cursor: string) => {
  try {
      const res = await db.oneOrNone<CursorObject>('SELECT * FROM cursors WHERE cursor = $1', cursor);
    if (res) {
      return true;
    } else return false;
  } catch (e) {
    console.log(e);
    return false; // perform saving
  }
};

/**
 *  
 * @param cursor `CursorObject array` containing cursors which needs to be saved
 * @returns Promise including true in case of success and undefined in case of error.
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

  /* try {
    return await db.task(async (t) => {
      const cursorRes = await t.oneOrNone<CursorObject>('SELECT * FROM cursors WHERE cursor = $1', cursor);
      console.log(cursorRes);
      if (!cursorRes) {
        console.log('storing cursor: ', cursor);
        await t.none('INSERT INTO cursors(cursor) VALUES($1)', cursor);
        return true;
      }
      return false;
    });
  
  } catch (e) {
    console.log(e);
    return undefined;
  } */
  
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

    /* if (counter === 0) {
      const tmp = page.data.map(storeGameResult);
      await Promise.all(tmp);
      console.log('first page saved');
    } */

    if (page) {
      path = page.cursor;
      const res = await storePage(page);
      if (res === false) {
        // stop fetching
        console.log('aborting');
        path = undefined;
        break;
      } else if (res === undefined) {
        error = true;
        path = undefined;
        result = 'sync failed due to error';
        break;
      } else if (counter > 0 && page.cursor) {
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

const pageSize = 50;

export const getPlayerHistory = (player: string, page: number) => {
  const offset = pageSize * page;
  return db.any<DbGameResult>(`
    SELECT * FROM gameResults WHERE playeraname = $1 OR playerbname = $1
    ORDER BY t DESC
    LIMIT $2
    OFFSET $3
    `,
    [player, pageSize, offset]
  )
    .then((result) => result.map(dbGameResultToGameResult))
    .catch((e) => {
      console.log(e);
      return { error: 'Oops, something went wrong' };
    });
};

export const getPlayerPageCount = (player: string) => {
  return db.one<{ count: string}>('SELECT COUNT(*) FROM gameResults WHERE playeraname = $1 OR playerbname = $1', player)
    .then((result) => Math.floor(Number(result.count) / pageSize))
    .catch((e) => {
      console.log(e);
      return { error: 'Oops, something went wrong' };
    });
};

export const getAllPlayers = () => {
  return db.any<{ player: string }>(`
    SELECT DISTINCT playerAname AS player FROM gameResults
      UNION
    SELECT DISTINCT playerBname AS player FROM gameResults;
    `)
    .then((result) => result.map((obj) => obj.player))
    .catch((e) => {
      console.log(e);
      const res: string[] = [];
      return res;
    });
};

export const getCursors = () => {
  return db.any('SELECT * FROM cursors')
    .then((response) => {
      if (isCursorObjectArray(response)) {
        return response.map((obj) => obj.cursor);
      }
      else return undefined;
    })
    .catch((e) => {
      console.log(e);
      return undefined;
    });
};

export const deleteAllCursors = () => {
  return db.none('DELETE FROM cursors');
};

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

const getMostPlayedHand = (t: ITask<Record<string, unknown>>, player: string) => {
  return t.oneOrNone<{ played: string, count: number }>(`
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
  `, player)
    .then((result) => result?.played)
    .catch((e) => {
      console.log(e);
      return undefined;
    });
};


const getTotalMatchedPlayed = (t: ITask<Record<string, unknown>>, player: string) => {
  return t.oneOrNone<{ totalgames: number }>(`
    SELECT CAST(COUNT(*) AS FLOAT) AS totalgames  FROM gameresults
    WHERE playeraname = $1 or playerbname = $1
  `, player)
    .then((result) => result?.totalgames)
    .catch((e) => {
      console.log(e);
      return undefined;
    });
};

const getWinratio = async (t: ITask<Record<string, unknown>>, player: string) => {
  return t.one<{ winratio: number }>(`
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
  `, player)
    .then((result) => result.winratio)
    .catch((e) => {
      console.log(e);
      return 0;
    });
};

/* export const getPlayerWinRatio = (player: string) => {
  return db.one<{ winratio: number }>(`
    SELECT A.WINS / A.TOTALGAMES as winratio
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
  `, player)
    .then((result) => result.winratio)
      .catch((e) => {
        console.log(e);
        return 0;
      });
}; */


/* export const storePage = async (page: Page) => {
  console.log('cursor: ', page.cursor);
  if (page.cursor && await storeCursor(page.cursor)) {
    console.log('storing page with cursor: ', page.cursor);
    const res = page.data.map((gameRes) => storeGameResult(gameRes));

    return await Promise.all(res)
      .then((result) => !result.includes(false))
      .catch((e) => {
        console.log(e);
        return false;
      });
  }
  return undefined;
}; */

/* export const storeGameResult = async (gameResult: GameResult) => {
  const values = [
    gameResult.gameId,
    gameResult.t,
    gameResult.playerA.name,
    gameResult.playerA.played,
    gameResult.playerB.name,
    gameResult.playerB.played
  ];

  const res = db.task(async (t) => {
    const gameRes = await t.oneOrNone<DbGameResult>('SELECT * FROM gameResults WHERE gameId = $1', gameResult.gameId);
    if (!gameRes) {
      console.log('storing gameresult: ', gameResult.gameId);
      await t.none('INSERT INTO gameResults(gameId, t, playerAname, playerAplayed, playerBname, playerBplayed) VALUES($1, $2, $3, $4, $5, $6)', values);

    }
  }).then((_events) => {
      return true;
    })  
    .catch((e)=> {
      console.log(e);
      return false;
    });
  return res;
}; */

