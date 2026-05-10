import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sl_session';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.date === getTodayKey()) return stored;
  } catch {}
  return { date: getTodayKey(), count: 0, topics: {}, startTime: Date.now() };
}

export function useSession() {
  const [session, setSession] = useState(loadSession);
  const [autoShow, setAutoShow] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    if (session.count > 0 && session.count % 25 === 0) {
      setAutoShow(true);
    }
  }, [session]);

  function recordWatch(video) {
    setSession(prev => {
      const today = getTodayKey();
      const base = prev.date === today ? prev : { date: today, count: 0, topics: {} };
      const topic = video?.channel?.category || 'general';
      return {
        ...base,
        count: base.count + 1,
        topics: { ...base.topics, [topic]: (base.topics[topic] || 0) + 1 },
        startTime: base.startTime || Date.now(),
      };
    });
  }

  return { session, recordWatch, autoShow, dismissAuto: () => setAutoShow(false) };
}
