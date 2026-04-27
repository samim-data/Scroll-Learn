import { refreshLibrary } from '../services/refreshLibrary.js';

refreshLibrary()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Refresh failed:', err);
    process.exit(1);
  });