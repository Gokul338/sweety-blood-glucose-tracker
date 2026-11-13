import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { validateReading } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    const params = [req.user.id];
    let sql = 'SELECT id, reading_date::text, time_slot, value, created_at, updated_at FROM readings WHERE user_id=$1';
    if (date) { params.push(date); sql += ` AND reading_date=$${params.length}`; }
    sql += ' ORDER BY reading_date DESC, CASE time_slot WHEN \'Morning (fasting)\' THEN 1 WHEN \'After breakfast\' THEN 2 WHEN \'After lunch\' THEN 3 ELSE 4 END';
    const result = await pool.query(sql, params);
    res.json({ readings: result.rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const message = validateReading(req.body || {});
    if (message) return res.status(400).json({ message });
    const { reading_date, time_slot, value } = req.body;
    const count = await pool.query('SELECT COUNT(*)::int AS count FROM readings WHERE user_id=$1 AND reading_date=$2', [req.user.id, reading_date]);
    if (count.rows[0].count >= 4) return res.status(400).json({ message: 'You can add only 4 readings per day.' });
    const result = await pool.query(
      'INSERT INTO readings(user_id,reading_date,time_slot,value) VALUES($1,$2,$3,$4) RETURNING id,reading_date::text,time_slot,value,created_at,updated_at',
      [req.user.id, reading_date, time_slot, Number(value)]
    );
    res.status(201).json({ reading: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: `You already have an ${req.body.time_slot} reading for this date.` });
    if (error.code === '23514') return res.status(400).json({ message: 'Value must be between 40 and 600 mg/dl.' });
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const message = validateReading(req.body || {});
    if (message) return res.status(400).json({ message });
    const { reading_date, time_slot, value } = req.body;
    const existing = await pool.query('SELECT id FROM readings WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Reading not found.' });
    const count = await pool.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id=$1 AND reading_date=$2 AND id<>$3',
      [req.user.id, reading_date, req.params.id]
    );
    if (count.rows[0].count >= 4) return res.status(400).json({ message: 'You can add only 4 readings per day.' });
    const result = await pool.query(
      `UPDATE readings SET reading_date=$1,time_slot=$2,value=$3,updated_at=NOW()
       WHERE id=$4 AND user_id=$5 RETURNING id,reading_date::text,time_slot,value,created_at,updated_at`,
      [reading_date, time_slot, Number(value), req.params.id, req.user.id]
    );
    res.json({ reading: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: `You already have an ${req.body.time_slot} reading for this date.` });
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM readings WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Reading not found.' });
    res.json({ message: 'Reading deleted successfully.' });
  } catch (error) { next(error); }
});
export default router;
