export default function TakeawaySlide({ slide }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'linear-gradient(160deg, #064e3b 0%, #0a0a0a 100%)' }}>
      <div className="text-4xl mb-6">💡</div>
      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-6">
        Remember This
      </div>
      <p className="text-2xl font-bold text-white leading-snug">
        {slide.sentence}
      </p>
    </div>
  );
}
