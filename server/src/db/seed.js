import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

const run = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const email = 'demo@sweety.local';
    const hash = await bcrypt.hash('SweetyDemo123!', 12);
    const userResult = await client.query(
      `INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3)
       ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name
       RETURNING id`, ['Demo Patient', email, hash]
    );
    const userId = userResult.rows[0].id;
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const samples = [
      [date, 'Morning (fasting)', 98],
      [date, 'After breakfast', 132],
      [date, 'After lunch', 145],
      [date, 'After dinner', 121]
    ];
    for (const [day, slot, value] of samples) {
      await client.query(
        `INSERT INTO readings(user_id,reading_date,time_slot,value) VALUES($1,$2,$3,$4)
         ON CONFLICT(user_id,reading_date,time_slot) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`,
        [userId, day, slot, value]
      );
    }
    await client.query('COMMIT');
    console.log('Seed complete: demo@sweety.local / SweetyDemo123!');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
};
run().catch(e => { console.error(e.message); process.exit(1); });
