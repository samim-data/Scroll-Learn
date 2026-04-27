import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabase.js';
import feedRouter from './routes/feed.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Scroll-learn backend is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('channels').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ channels: data, count: data.length });
});

app.use('/api', feedRouter);
app.use('/api/admin', adminRouter);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});