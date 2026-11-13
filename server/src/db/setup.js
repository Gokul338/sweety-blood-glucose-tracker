import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from './pool.js';
const here = path.dirname(fileURLToPath(import.meta.url));
try {
  const sql = await fs.readFile(path.resolve(here, '../../schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema created successfully.');
} catch (error) {
  console.error('Database setup failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
