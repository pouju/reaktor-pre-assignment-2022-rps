import { JSONSchemaType } from 'ajv';
import { GameBegin, GameResult, Page, Played, Player, PlayerSummaryData } from '../types';

export const playedSchema: JSONSchemaType<Player> = {
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
}

export const gameResultSchema: JSONSchemaType<GameResult> = {
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
}

export const pageResponseSchema: JSONSchemaType<Page> = {
  type: 'object',
  properties: {
    cursor: { 
      type: 'string',
      nullable: true },
    data: {
      type: 'array',
      items: gameResultSchema
    }
  },
  required: ['data'],
  additionalProperties: false
}

export const gameResultArraySchema: JSONSchemaType<GameResult[]> = {
  type: 'array',
  items: gameResultSchema
}

export const gameBeginSchema: JSONSchemaType<GameBegin> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['GAME_BEGIN']
    },
    gameId: { type: 'string'},
    playerA: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name'],
      additionalProperties: false
    },
    playerB: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name'],
      additionalProperties: false
    },
  },
  required: ['type', 'gameId', 'playerA', 'playerB'],
  additionalProperties: false
};

export const playerSummarySchema: JSONSchemaType<PlayerSummaryData> = {
  type: 'object',
  properties: {
    winRatio: { type: 'number' },
    totalGames: { type: 'number' },
    mostPlayedHand: {
      type: 'string',
      enum: Object.values(Played).filter((value) => typeof value === 'string')
    }
  },
  required: ['winRatio', 'totalGames', 'mostPlayedHand'],
  additionalProperties: false
};