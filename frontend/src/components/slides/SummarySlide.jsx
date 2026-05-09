export default function SummarySlide({ slide }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #0a0a2e 100%)' }}>
      <div className="text-6xl mb-6">{slide.emoji}</div>
      <h2 className="text-2xl font-bold text-white mb-4 leading-snug">{slide.title}</h2>
      <p className="text-base text-blue-100 leading-relaxed">{slide.body}</p>
    </div>
  );
}
