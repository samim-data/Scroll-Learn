import { useState } from 'react';

export default function QuizSlide({ slide }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (i) => {
    if (selected !== null) return; // lock after first tap
    setSelected(i);
  };

  const getOptionStyle = (i) => {
    if (selected === null) return 'border-zinc-600 text-white';
    if (i === slide.answer_index) return 'border-green-500 bg-green-500/20 text-green-300';
    if (i === selected) return 'border-red-500 bg-red-500/20 text-red-300';
    return 'border-zinc-700 text-zinc-500';
  };

  return (
    <div className="h-full w-full flex flex-col justify-center px-6"
      style={{ background: '#0f172a' }}>
      <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
        Quick Check
      </div>
      <p className="text-lg font-semibold text-white mb-6 leading-snug">{slide.question}</p>

      <div className="flex flex-col gap-3 mb-5">
        {slide.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${getOptionStyle(i)}`}
          >
            {opt}
          </button>
        ))}
      </div>

      {selected !== null && (
        <div className="mt-2 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700">
          <p className="text-xs text-zinc-400 leading-relaxed">{slide.explanation}</p>
        </div>
      )}
    </div>
  );
}
