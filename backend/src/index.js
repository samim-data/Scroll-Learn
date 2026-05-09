import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import feedRouter from './routes/feed.js';
import adminRouter from './routes/admin.js';
import deepdiveRoutes from './routes/deepdive.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', deepdiveRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Scroll-learn backend is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api', feedRouter);
app.use('/api/admin', adminRouter);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});