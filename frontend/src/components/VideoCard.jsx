export default function VideoCard({ video, isActive }) {
  return (
    <div className="h-screen w-full flex items-center justify-center snap-start snap-always relative bg-black">
      <div className="relative h-[80vh] w-full max-w-[min(100vw,calc(80vh*9/16))] bg-black rounded-2xl overflow-hidden">
        {/* Thumbnail layer */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${video.thumbnail_url})` }}
        />

        {/* Play button overlay only on inactive cards (purely visual) */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}