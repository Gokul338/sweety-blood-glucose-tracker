import dotenv from 'dotenv';
dotenv.config();
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Copy .env.example to .env and configure it.');
  process.exit(1);
}
const { default: app } = await import('./app.js');
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Sweety API listening on http://localhost:${port}`));
