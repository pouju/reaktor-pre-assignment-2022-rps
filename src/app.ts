import config from './utils/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { syncBadApiAndDb } from './services/historyDataService';
import historyDataRouter from './controllers/historyData';

const app = express();

mongoose.connect(config.MONGO_URI)
  .then(() => {
    console.log('connection to MongoDB succeed');
  })
  .catch((e) => {
    console.log('connection to MongoDB failed: ', e);
  });

app.use(cors());
app.use(express.static('client/build'));
app.use(express.json());

/**
 * Keep BadApi and DB in synch by getting new game results frequently (on every ten minute)
 */
let lock = false;
setInterval(() => {
  if (!lock) {
    lock = true;
    console.log('syncing data');
    syncBadApiAndDb()
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
}, 600000);

app.get('/ping', (_req, res) => {
  res.send('This is RPS result api!');
});

app.use('/api/history', historyDataRouter);

app.get('*', (_req, res) =>  {
  res.status(404).json({ error: 'Unknown endpoint' });
});

export default app;
