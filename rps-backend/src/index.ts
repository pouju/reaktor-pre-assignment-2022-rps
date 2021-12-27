import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { syncBadApiAndDb } from './services/historyDataService';
import historyDataRouter from './routes/historyDataRouter';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.APP_PORT) || 3001;



/**
 * Keep BadApi and DB in synch by getting new game results frequently (on every one minute)
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
  console.log('someone pinged here');
  res.send('pong!');
});

app.use('/api/history', historyDataRouter);

app.get('*', (_req, res) =>  {
  res.json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* app.get('/updateCursors', (_req, res) => {
  console.log('starting cursos fetch');
  updateCursors()
    .then(async () => res.json(await getCursors()))
    .catch((e) => res.send(e));
}); */
