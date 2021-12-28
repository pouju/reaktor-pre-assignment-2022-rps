"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCursorObjectArray = exports.isCursorObject = exports.isStringArray = exports.isString = exports.Played = void 0;
var Played;
(function (Played) {
    Played["Rock"] = "ROCK";
    Played["Paper"] = "PAPER";
    Played["Scissors"] = "SCISSORS";
})(Played = exports.Played || (exports.Played = {}));
const isString = (text) => {
    return typeof text === 'string' || text instanceof String;
};
exports.isString = isString;
const isStringArray = (array) => {
    return Array.isArray(array) && array !== null && array.every(exports.isString);
};
exports.isStringArray = isStringArray;
function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
const isCursorObject = (obj) => {
    return typeof obj === 'object' && obj !== null && hasOwnProperty(obj, 'cursor') && (0, exports.isString)(obj.cursor);
};
exports.isCursorObject = isCursorObject;
const isCursorObjectArray = (array) => {
    return Array.isArray(array) && array !== null && array.every(exports.isCursorObject);
};
exports.isCursorObjectArray = isCursorObjectArray;
