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

export interface GameBegin {
  type: 'GAME_BEGIN',
  gameId: string,
  playerA: {
    name: string
  },
  playerB: {
    name: string
  }
}

export interface Page {
  cursor?: string,
  data: GameResult[]
}

export interface PlayerSummaryData {
  winRatio: number,
  totalGames: number,
  mostPlayedHand: Played,
}

export const isString = (text: unknown): text is string => {
  return typeof text === 'string' || text instanceof String;
};

export const isStringArray = (array: unknown): array is string[] => {
  return Array.isArray(array) && array !== null && array.every(isString);
}
