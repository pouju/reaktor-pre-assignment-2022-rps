"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const cursorSchema = new mongoose_1.Schema({
    cursor: {
        type: String,
        required: true
    },
});
cursorSchema.set('toJSON', {
    transform: (_document, returnObject) => {
        delete returnObject._id;
        delete returnObject.__v;
    }
});
exports.default = (0, mongoose_1.model)('CursorModel', cursorSchema);
