import express from 'express';
import { refreshLibrary } from '../services/refreshLibrary.js';

const router = express.Router();

router.post('/refresh', async (req, res) => {
  // Simple secret-based auth so random people can't trigger this
  const secret = req.headers['x-refresh-secret'];
  if (secret !== process.env.REFRESH_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await refreshLibrary();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;