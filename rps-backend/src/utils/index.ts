import Ajv, { JSONSchemaType } from 'ajv';
import { Page, GameResult, Player, Played, MostPlayedHandResponse,} from '../types';

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

const validatePage = ajv.compile(pageResponseSchema);

/**
 * 
 * @param page unkown axios response data wanna be Page.
 * @returns page is db format or undefined in case of incorrect data / validation errors.
 */
export const validatePageResponse = (page: unknown): Page | undefined => {
  if (validatePage(page)) {
    return page;
  }
  console.log('pageResponse validation errors: ', validatePage.errors);
  return undefined;
};

const monstPlayedHandResponseSchema: JSONSchemaType<MostPlayedHandResponse[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        enum: Object.values(Played).filter((value) => typeof value === 'string')
      },
      count: { type: 'number' }
    },
    required: ['_id', 'count'],
    additionalProperties: false
  }
};

const validateMostPlayedHand = ajv.compile(monstPlayedHandResponseSchema);

/**
 * 
 * @param response Response get from mongodb containing array of played hand count
 * @returns array of `MostPlayedHandResponse` if response data was valid and `undefined` if data was invalid
 */
export const validateMostPlayedHandResponse = (response: unknown) => {
  if (validateMostPlayedHand(response)) {
    return response;
  }
  console.log(validateMostPlayedHand.errors);
  return undefined;
};