import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'

/**
 * VideoModal — lightbox de vídeo em tela cheia (portal no <body>).
 * Fecha no botão, no clique do fundo e na tecla Esc; trava o scroll enquanto
 * está aberto. Usado por <VideoLightbox /> e <VideoTestimonialCard />.
 */
export function VideoModal({ videoId, onClose, title = 'Vídeo' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    // trava o scroll do fundo enquanto o lightbox está aberto
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-2 sm:p-6 md:p-12"
    >
      <div className="absolute right-4 top-4 z-10 md:right-8 md:top-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar vídeo"
          className="group flex items-center gap-3 text-white/70 transition-colors hover:text-white"
        >
          <span className="hidden text-sm font-medium uppercase tracking-wide sm:block">Fechar</span>
          <div className="rounded-full bg-white/10 p-3 transition-colors group-hover:bg-white/25">
            <X size={24} />
          </div>
        </button>
      </div>

      {/* stopPropagation: clicar no player não fecha o modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative aspect-video w-full max-w-[1400px] overflow-hidden rounded-xl bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
      >
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&cc_load_policy=0&iv_load_policy=3&showinfo=0`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>,
    document.body,
  )
}
