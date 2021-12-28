"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./utils/config"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const historyDataService_1 = require("./services/historyDataService");
const historyData_1 = __importDefault(require("./controllers/historyData"));
const app = (0, express_1.default)();
mongoose_1.default.connect(config_1.default.MONGO_URI)
    .then(() => {
    console.log('connection to MongoDB succeed');
})
    .catch((e) => {
    console.log('connection to MongoDB failed: ', e);
});
app.use((0, cors_1.default)());
app.use(express_1.default.static('client/build'));
app.use(express_1.default.json());
/**
 * Keep BadApi and DB in synch by getting new game results frequently (on every ten minute)
 */
let lock = false;
setInterval(() => {
    if (!lock) {
        lock = true;
        console.log('syncing data');
        (0, historyDataService_1.syncBadApiAndDb)()
            .then((result) => {
            console.log(result);
            lock = false;
        })
            .catch((e) => {
            console.log(e);
            lock = false;
        });
    }
    else {
        console.log('lock is set');
    }
    // ping heroku app to keep it awake
    try {
        http_1.default.get('http://rps-results.herokuapp.com');
    }
    catch (e) {
        console.log('Pinging application failed', e);
    }
}, 600000);
app.get('/ping', (_req, res) => {
    res.send('This is RPS result api!');
});
app.use('/api/history', historyData_1.default);
app.get('*', (_req, res) => {
    res.status(404).json({ error: 'Unknown endpoint' });
});
exports.default = app;
