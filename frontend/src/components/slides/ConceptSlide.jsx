export default function ConceptSlide({ slide }) {
  return (
    <div className="h-full w-full flex flex-col justify-center px-6"
      style={{ background: '#2d1b69' }}>
      <div className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">
        Key Concept
      </div>
      <h2 className="text-3xl font-bold text-white mb-5">{slide.term}</h2>
      <div className="w-12 h-1 bg-yellow-400 rounded mb-5" />
      <p className="text-base text-purple-100 leading-relaxed">{slide.definition}</p>
    </div>
  );
}
