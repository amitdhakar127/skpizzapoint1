import React, { useState } from 'react';
import { Play, Youtube, ExternalLink, X, Film, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';

export const VideosPage: React.FC = () => {
  const { videos, navigate } = useApp();
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const publishedVideos = videos.filter((v) => v.isPublished);

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 text-red-900 text-xs font-black uppercase tracking-wider">
            <Youtube className="w-4 h-4 text-red-600" />
            <span>YouTube Video Showcase</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#1E1915]">
            See Our Kitchen in Action
          </h1>
          <p className="text-sm sm:text-base text-[#6B5B4F]">
            Watch our cheese pulls, stone-oven crust baking, and fresh sandwich grilling behind the scenes.
          </p>
        </div>

        {/* Video Grid */}
        {publishedVideos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-amber-200 max-w-md mx-auto space-y-3">
            <Film className="w-12 h-12 text-neutral-400 mx-auto" />
            <h3 className="font-extrabold text-lg text-[#1E1915]">No videos published yet</h3>
            <p className="text-xs text-[#6B5B4F]">
              The restaurant owner can easily add YouTube video URLs directly inside the Admin Studio!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publishedVideos.map((video) => {
              const defaultThumb =
                video.thumbnailUrl ||
                `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

              return (
                <div
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className="group bg-white rounded-3xl overflow-hidden border border-amber-200 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                >
                  {/* Thumbnail container */}
                  <div
                    className={`relative w-full overflow-hidden bg-neutral-900 ${
                      video.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-96' : 'aspect-video'
                    }`}
                  >
                    <img
                      src={defaultThumb}
                      alt={video.title}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />

                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </div>

                    {/* Format Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-bold">
                      {video.aspectRatio === '9:16' ? 'Shorts (9:16)' : 'Video (16:9)'}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-black text-base sm:text-lg text-[#1E1915] group-hover:text-amber-700 transition-colors line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-[#6B5B4F] line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#1E1915] rounded-3xl overflow-hidden shadow-2xl border border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Iframe Container */}
            <div
              className={`w-full bg-black mx-auto flex items-center justify-center ${
                activeVideo.aspectRatio === '9:16'
                  ? 'max-w-sm aspect-[9/16] h-[75vh]'
                  : 'aspect-video w-full'
              }`}
            >
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Video info below */}
            <div className="p-6 text-white space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">{activeVideo.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">{activeVideo.description}</p>
              </div>

              <a
                href={activeVideo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
