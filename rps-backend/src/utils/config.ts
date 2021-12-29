import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || '';
const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 50;

export default {
  PORT,
  MONGO_URI,
  PAGE_SIZE
};
