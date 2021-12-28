import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;
const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 50;

export default {
  PORT,
  PAGE_SIZE
};