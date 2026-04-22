import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});
