import { useState } from 'react'
import { Play } from '@phosphor-icons/react'
import { VideoModal } from './VideoModal'

/**
 * VideoLightbox — preview do vídeo em loop mudo (usado no hero); o clique abre
 * o vídeo com som em tela cheia via <VideoModal />.
 */
export function VideoLightbox({ videoId }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div
        className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl border border-hairline shadow-subtle ring-1 ring-inset ring-white/10"
        onClick={() => setIsOpen(true)}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* O scale esconde os controles e títulos que o YouTube desenha nas bordas */}
          <iframe
            className="pointer-events-none h-full w-full scale-[1.35] transform"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&mute=1&controls=0&playlist=${videoId}&rel=0&modestbranding=1&playsinline=1&cc_load_policy=0&iv_load_policy=3&disablekb=1&fs=0`}
            title="Vídeo de demonstração"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            tabIndex="-1"
          />
        </div>

        {/* Overlay que destaca o play e captura o clique */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/10 transition-colors group-hover:bg-surface/5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-1 h-8 w-8" weight="fill" />
          </div>
        </div>
      </div>

      {isOpen && <VideoModal videoId={videoId} onClose={() => setIsOpen(false)} />}
    </>
  )
}
