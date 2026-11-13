import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { reportStats } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

async function getReport(userId, start, end, includeReadings = false) {
  const result = await pool.query(
    `SELECT id,reading_date::text,time_slot,value FROM readings
     WHERE user_id=$1 AND reading_date >= $2 AND reading_date <= $3
     ORDER BY reading_date, CASE time_slot WHEN 'Morning (fasting)' THEN 1 WHEN 'After breakfast' THEN 2 WHEN 'After lunch' THEN 3 ELSE 4 END`,
    [userId, start, end]
  );
  return { startDate: start, endDate: end, ...reportStats(result.rows), ...(includeReadings ? { readings: result.rows } : {}) };
}
function parseDate(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0,10) !== date ? null : d;
}
const fmt = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;

router.get('/daily', async (req, res, next) => {
  try {
    const date = parseDate(req.query.date);
    if (!date) return res.status(400).json({ message: 'Please provide a valid date=YYYY-MM-DD.' });
    res.json(await getReport(req.user.id, fmt(date), fmt(date), true));
  } catch (e) { next(e); }
});
router.get('/month-to-date', async (req, res, next) => {
  try {
    const date = parseDate(req.query.date);
    if (!date) return res.status(400).json({ message: 'Please provide a valid date=YYYY-MM-DD.' });
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    res.json(await getReport(req.user.id, fmt(start), fmt(date)));
  } catch (e) { next(e); }
});
router.get('/previous-month', async (req, res, next) => {
  try {
    const date = parseDate(req.query.date);
    if (!date) return res.status(400).json({ message: 'Please provide a valid date=YYYY-MM-DD.' });
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth()-1, 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 0));
    res.json(await getReport(req.user.id, fmt(start), fmt(end)));
  } catch (e) { next(e); }
});
export default router;
