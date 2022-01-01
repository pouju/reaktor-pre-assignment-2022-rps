import Ajv from 'ajv';
import { Player, Played } from '../types';
import {
  gameBeginSchema,
  gameResultArraySchema,
  gameResultSchema,
  playerSummarySchema
} from './JSONSchemas';

const ajv = new Ajv();

const validateGameResultArray = ajv.compile(gameResultArraySchema);

/**
 * Validates game result history data
 * @param history unkown data array wanna be `GameResult`- array
 * @returns `GameResult[]` if `history` was valid and undefined in case of validation error
 */
export const validateHistoryResponse = (history: unknown) => {
  if (validateGameResultArray(history)) {
    return history;
  }
  console.log(validateGameResultArray.errors);
  return undefined;
}

const validateGameResult = ajv.compile(gameResultSchema);
const validateGameBegin = ajv.compile(gameBeginSchema);

/**
 * Validates websocket responses received from Bad Api
 * @param data unknown data wanna be `GameResult` or `GameBegin`
 * @returns returns `GameResult` or `GameBegin` object or undefined in case of validation error
 */
export const validateWsResponse = (data: unknown) => {
  if (validateGameResult(data) || validateGameBegin(data)) {
    return data;
  }
  const error = validateGameBegin.errors !== null && validateGameBegin.errors !== undefined ? validateGameBegin.errors : validateGameResult.errors;
  console.log(error);
  return undefined;
}

const validatePlayerSummary = ajv.compile(playerSummarySchema);

/**
 * Validates summary response get from backend
 * @param data unknown data wanna be `PlayerSummaryData`
 * @returns `PlayerSummaryData` object if validation succeed or undefined if validation failed
 */
export const validateSummaryResponse = (data: unknown) => {
  if (validatePlayerSummary(data)) {
    return data;
  }
  console.log(validatePlayerSummary.errors);
  return undefined;
}

/**
 * 
 * @param playerA `Player`- object of player A
 * @param playerB `Player`- object of player B
 * @returns Returns the winner `Player`- object, i.e. A or B. In case of draw game returns undefined
 */
export const getWinner = (playerA: Player, playerB: Player): Player | undefined => {
  const aPlayed = playerA.played;
  const bPlayed = playerB.played;

  if (aPlayed === bPlayed) {
    return undefined;
  }
  
  if (aPlayed === Played.Paper) {
    if (bPlayed === Played.Rock) {
      return playerA;
    }
    return playerB;
  }
  if (aPlayed === Played.Rock) {
    if (bPlayed === Played.Scissors) {
      return playerA;
    }
    return playerB;
  }
  if (aPlayed === Played.Scissors) {
    if (bPlayed === Played.Paper) {
      return playerA;
    }
    return playerB;
  }

  return undefined;
}
