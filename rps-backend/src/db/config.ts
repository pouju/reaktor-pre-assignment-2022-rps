import * as dotenv from 'dotenv';
import pgPromise from 'pg-promise';

dotenv.config();

const pgp = pgPromise();

const userName = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const database = process.env.POSTGRES_DB;

const db = pgp(`postgres://${userName}:${password}@localhost:5432/${database}`);

export {
  db,
  pgp,
};
