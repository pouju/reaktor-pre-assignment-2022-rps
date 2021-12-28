"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMostPlayedHandResponse = exports.validatePageResponse = void 0;
const ajv_1 = __importDefault(require("ajv"));
const types_1 = require("../types");
const ajv = new ajv_1.default();
const playedSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        played: {
            type: 'string',
            enum: Object.values(types_1.Played).filter((value) => typeof value === 'string')
        }
    },
    required: ['name', 'played'],
    additionalProperties: false
};
const pageDataItemSchema = {
    type: 'object',
    properties: {
        type: {
            type: 'string',
            enum: ['GAME_RESULT']
        },
        gameId: { type: 'string' },
        t: { type: 'number' },
        playerA: playedSchema,
        playerB: playedSchema
    },
    required: ['type', 'gameId', 't', 'playerA', 'playerB'],
    additionalProperties: false
};
const pageResponseSchema = {
    type: 'object',
    properties: {
        cursor: {
            type: 'string',
            nullable: true
        },
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
const validatePageResponse = (page) => {
    if (validatePage(page)) {
        return page;
    }
    console.log('pageResponse validation errors: ', validatePage.errors);
    return undefined;
};
exports.validatePageResponse = validatePageResponse;
const monstPlayedHandResponseSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                enum: Object.values(types_1.Played).filter((value) => typeof value === 'string')
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
const validateMostPlayedHandResponse = (response) => {
    if (validateMostPlayedHand(response)) {
        return response;
    }
    console.log(validateMostPlayedHand.errors);
    return undefined;
};
exports.validateMostPlayedHandResponse = validateMostPlayedHandResponse;
