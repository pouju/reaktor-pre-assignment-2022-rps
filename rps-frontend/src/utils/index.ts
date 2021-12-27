import Ajv from 'ajv';
import { Player, Played } from '../types';
import {
  gameBeginSchema,
  gameResultArraySchema,
  gameResultSchema,
  pageResponseSchema,
  playerSummarySchema
} from './JSONSchemas';

const ajv = new Ajv();

const validatePage = ajv.compile(pageResponseSchema);

export const validatePageResponse = (page: unknown) => {
  if (validatePage(page)) {
    return page;
  }
  console.log(validatePage.errors)
  return undefined;
}

const validateGameResultArray = ajv.compile(gameResultArraySchema);

export const validateHistoryResponse = (history: unknown) => {
  if (validateGameResultArray(history)) {
    return history;
  }
  console.log(validateGameResultArray.errors);
  return undefined;
}

const validateGameResult = ajv.compile(gameResultSchema);
const validateGameBegin = ajv.compile(gameBeginSchema);

export const validateWsResponse = (data: unknown) => {
  if (validateGameResult(data) || validateGameBegin(data)) {
    return data;
  }
  const error = validateGameBegin.errors !== null && validateGameBegin.errors !== undefined ? validateGameBegin.errors : validateGameResult.errors;
  console.log(error);
  return undefined;
}

const validatePlayerSummary = ajv.compile(playerSummarySchema);

export const validateSummaryResponse = (data: unknown) => {
  if (validatePlayerSummary(data)) {
    return data;
  }
  console.log(validatePlayerSummary.errors);
  return undefined;
}

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

