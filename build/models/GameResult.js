"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
const gameResultSchema = new mongoose_1.Schema({
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
        type: new mongoose_1.Schema({
            name: {
                type: String,
                required: true
            },
            played: {
                type: String,
                enum: Object.values(types_1.Played).filter((value) => typeof value === 'string'),
                required: true
            }
        }),
        required: true
    },
    playerB: {
        type: new mongoose_1.Schema({
            name: {
                type: String,
                required: true
            },
            played: {
                type: String,
                enum: Object.values(types_1.Played).filter((value) => typeof value === 'string'),
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
exports.default = (0, mongoose_1.model)('GameResultModel', gameResultSchema);
