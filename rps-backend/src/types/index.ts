export interface CursorObject {
  cursor: string
}

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

export const isString = (text: unknown): text is string => {
  return typeof text === 'string' || text instanceof String;
};
