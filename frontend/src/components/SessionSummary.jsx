import { useState } from 'react';

function formatWatchTime(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return '<1m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

const TOPIC_LABELS = {
  science: 'Science',
  tech: 'Tech & Coding',
  business: 'Business & Money',
  math: 'Math',
  history: 'History & Culture',
  mind: 'Philosophy & Mind',
  health: 'Health & Biology',
  language: 'Language',
  general: 'General',
};

function getMilestoneMessage(count) {
  if (count >= 50) return 'You\'re a knowledge machine.';
  if (count >= 30) return 'Seriously impressive. Keep going.';
  if (count >= 20) return 'You\'re on a roll!';
  if (count >= 10) return 'Knowledge compounds. Keep it up.';
  return 'Great start!';
}

export default function SessionSummary({ session, autoShow, onDismissAuto }) {
  const [manualOpen, setManualOpen] = useState(false);
  const isOpen = autoShow || manualOpen;

  const watchMs = Date.now() - (session.startTime || Date.now());
  const watchFormatted = formatWatchTime(watchMs);

  const topics = Object.entries(session.topics || {}).sort((a, b) => b[1] - a[1]);

  function dismiss() {
    onDismissAuto();
    setManualOpen(false);
  }

  return (
    <>
      {/* Pill — top left */}
      <button
        onClick={() => setManualOpen(true)}
        className="fixed top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/20 hover:bg-white/20 transition"
      >
        <span>📚</span>
        <span>{session.count}</span>
        <span className="text-white/40">·</span>
        <span>{watchFormatted}</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={dismiss} />
          <div className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-50 bg-zinc-900 rounded-3xl p-6 max-w-sm mx-auto">
            <div className="text-5xl text-center mb-4">🎓</div>

            {/* Stat boxes */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center">
                <span className="text-white text-3xl font-bold">{session.count}</span>
                <span className="text-zinc-400 text-xs mt-1">videos today</span>
              </div>
              <div className="flex-1 bg-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center">
                <span className="text-white text-3xl font-bold">{watchFormatted}</span>
                <span className="text-zinc-400 text-xs mt-1">watch time</span>
              </div>
            </div>

            <p className="text-zinc-400 text-sm text-center mb-5">
              {getMilestoneMessage(session.count)}
            </p>

            {topics.length > 0 && (
              <div className="bg-zinc-800 rounded-2xl p-4 mb-5 space-y-2">
                <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Topics explored</p>
                {topics.map(([topic, count]) => (
                  <div key={topic} className="flex items-center justify-between">
                    <span className="text-white text-sm">{TOPIC_LABELS[topic] || topic}</span>
                    <span className="text-zinc-400 text-xs">
                      {count} video{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={dismiss}
              className="w-full py-3 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-100 transition"
            >
              Keep Learning
            </button>
          </div>
        </>
      )}
    </>
  );
}
