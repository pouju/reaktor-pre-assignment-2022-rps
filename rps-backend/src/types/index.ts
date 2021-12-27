/* export interface Cursor {
  cursor: string
} */

export interface CursorObject {
  cursor: string
}

export const isString = (text: unknown): text is string => {
  return typeof text === 'string' || text instanceof String;
};

/* export const isCursor = (cursor: unknown): cursor is Cursor => {
  return isString(cursor); // improve
}; */

function hasOwnProperty
  // eslint-disable-next-line @typescript-eslint/ban-types
  <X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}


export const isCursorObject = (obj: unknown): obj is CursorObject => {
  return typeof obj === 'object' && obj !== null && hasOwnProperty(obj, 'cursor') && isString(obj.cursor);
};

export const isCursorObjectArray = (array: unknown): array is CursorObject[] => {
  return Array.isArray(array) && array !== null && array.every(isCursorObject);
};

export enum Played {
  Rock  = 'ROCK',
  Paper = 'PAPER',
  Scissors = 'SCISSORS'
}

export interface Player {
  name: string,
  played: Played
}

export interface GameResult {
  type: 'GAME_RESULT',
  gameId: string,
  t: number,
  playerA: Player,
  playerB: Player 
}

export interface Page {
  cursor?: string,
  data: GameResult[]
}

export interface DbGameResult {
  gameid: string,
  t: number,
  playeraname: string,
  playeraplayed: string,
  playerbname: string,
  playerbplayed: string,
}

export interface DbPage {
  cursor?: string,
  data: DbGameResult[]
}

