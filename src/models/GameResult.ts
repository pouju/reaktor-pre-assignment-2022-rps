import { Schema, model } from 'mongoose';
import { GameResult, Played, Player } from '../types';

const gameResultSchema = new Schema<GameResult>({
  type: {
    type: String,
    enum: ['GAME_RESULT'],
    required: true
  },
  gameId: {
    type: String,
    required: true
  },
  t: {
    type: Number,
    required: true
  },
  playerA: {
    type: new Schema<Player>({
      name: {
        type: String,
        required: true
      },
      played: {
        type: String,
        enum: Object.values(Played).filter((value) => typeof value === 'string'),
        required: true
      }
    }),
    required: true
  },
  playerB: {
    type: new Schema<Player>({
      name: {
        type: String,
        required: true
      },
      played: {
        type: String,
        enum: Object.values(Played).filter((value) => typeof value === 'string'),
        required: true
      }
    }),
    required: true
  },
});

gameResultSchema.set('toJSON', {
  transform: (_document, returnObject) => {
    delete returnObject._id;
    delete returnObject.__v;
    delete returnObject.playerA._id;
    delete returnObject.playerB._id;
  }
});

export default model('GameResultModel', gameResultSchema);
