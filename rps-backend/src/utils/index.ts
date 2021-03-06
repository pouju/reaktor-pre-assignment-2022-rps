import Ajv, { JSONSchemaType } from 'ajv';
import { Page, DbPage, GameResult, DbGameResult, Player, Played,} from '../types';

export const dbGameResultToGameResult = (gameResult: DbGameResult): GameResult => {
  return {
    type: 'GAME_RESULT',
    gameId: gameResult.gameid,
    t: Number(gameResult.t),
    playerA: {
      name: gameResult.playeraname,
      played: gameResult.playeraplayed as Played
    },
    playerB: {
      name: gameResult.playerbname,
      played: gameResult.playerbplayed as Played
    }
  };
};

const pageToDbPage = (page: Page): DbPage => {

  const gameResultToDbGameResult = (gameResult: GameResult): DbGameResult => {
    return {
      gameid: gameResult.gameId,
      t: gameResult.t,
      playeraname: gameResult.playerA.name,
      playeraplayed: gameResult.playerA.played,
      playerbname: gameResult.playerB.name,
      playerbplayed: gameResult.playerB.played
    };
  };

  return {
    cursor: page.cursor,
    data: page.data.map(gameResultToDbGameResult)
  };
};

const ajv = new Ajv();

const playedSchema: JSONSchemaType<Player> = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    played: {
      type: 'string',
      enum: Object.values(Played).filter((value) => typeof value === 'string')
    }
  },
  required: ['name', 'played'],
  additionalProperties: false
};

const pageDataItemSchema: JSONSchemaType<GameResult> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['GAME_RESULT']
    },
    gameId: { type: 'string'},
    t: { type: 'number' },
    playerA: playedSchema,
    playerB: playedSchema
  },
  required: ['type', 'gameId', 't', 'playerA', 'playerB'],
  additionalProperties: false
};

const pageResponseSchema: JSONSchemaType<Page> = {
  type: 'object',
  properties: {
    cursor: { 
      type: 'string',
      nullable: true },
    data: {
      type: 'array',
      items: pageDataItemSchema
    }
  },
  required: ['data'],
  additionalProperties: false
};

const validate = ajv.compile(pageResponseSchema);

/**
 * 
 * @param page unkown axios response data wanna be Page.
 * @returns page in db format or undefined in case of incorrect data / validation errors.
 */
export const validatePageResponse = (page: unknown): DbPage | undefined => {
  if (validate(page)) {
    return pageToDbPage(page);
  }
  console.log('pageResponse validation errors: ', validate.errors);
  return undefined;
};
