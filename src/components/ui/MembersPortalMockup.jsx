import { Play, CheckCircle, Lock, MonitorPlay, FileText, CaretRight } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * MembersPortalMockup — mockup de portal de membros/curso para a hero.
 * Superfícies temáveis; a área de vídeo é sempre escura (neutral-900).
 */
export function MembersPortalMockup({ className }) {
  return (
    <div
      className={cn(
        'relative mx-auto flex w-full max-w-5xl overflow-hidden rounded-xl border border-hairline bg-surface shadow-soft',
        className,
      )}
    >
      {/* SIDEBAR */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-ink/[0.03] p-4 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="h-8 w-8 animate-pulse rounded bg-emerald" />
          <div className="h-4 w-24 animate-pulse rounded bg-ink/20" />
        </div>

        <nav className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-md border border-hairline bg-surface px-3 py-2 text-sm font-medium text-emerald shadow-subtle">
            <MonitorPlay size={16} />
            Módulo 1: Meta Ads
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-mute transition-colors hover:bg-ink/5"
            >
              <Lock size={16} className="opacity-50" />
              Módulo {i + 1}
            </div>
          ))}
        </nav>

        <div className="mt-auto px-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div className="h-full w-1/4 rounded-full bg-emerald" />
          </div>
          <div className="mt-2 text-xs font-medium text-mute">25% Concluído</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col bg-surface">
        <div className="flex h-16 items-center justify-between border-b border-hairline px-6">
          <div className="flex items-center gap-2 text-sm font-medium text-mute">
            <span>Módulo 1</span>
            <CaretRight size={14} />
            <span className="text-ink">Aula 01: Estrutura de campanha que vende</span>
          </div>
          <div className="h-8 w-8 animate-pulse rounded-full bg-ink/10" />
        </div>

        <div className="flex h-full flex-col gap-6 overflow-hidden p-6 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4">
            <div className="group relative flex aspect-video w-full flex-col justify-end overflow-hidden rounded-lg bg-neutral-900 inset-shadow-sm">
              <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-900 to-emerald/20 opacity-80" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-16 w-16 animate-ping rounded-full bg-emerald/30" />
                  <div className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-emerald text-white shadow-soft transition-transform duration-200 hover:scale-105">
                    <Play size={24} weight="fill" className="ml-1" />
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex h-12 w-full items-center gap-4 bg-linear-to-t from-black/80 to-transparent px-4">
                <Play size={16} weight="fill" className="text-white" />
                <div className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20">
                  <div className="relative h-full w-[45%] overflow-hidden rounded-full bg-emerald">
                    <div className="absolute inset-0 h-full w-full -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent" />
                  </div>
                </div>
                <div className="font-mono text-xs font-medium text-white/80">12:34 / 45:00</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-medium tracking-tight text-ink">Aula 01: Estrutura de campanha que vende</h3>
              <p className="max-w-2xl text-sm leading-relaxed text-body">
                Monte campanhas de Meta Ads do zero: públicos, criativos e a estrutura que escala sem
                estourar o custo por venda.
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <div className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-ink/10">
                <FileText size={14} /> Material de Apoio.pdf
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 rounded-lg border border-hairline bg-surface p-4 shadow-subtle lg:w-72">
            <h4 className="text-sm font-medium uppercase tracking-widest text-mute">Conteúdo do Módulo</h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 rounded-md bg-ink/5 p-2">
                <div className="mt-0.5 flex shrink-0 text-emerald">
                  <Play size={16} weight="fill" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink">1. Estrutura de campanha que vende</span>
                  <span className="text-xs text-mute">45 min</span>
                </div>
              </div>

              <div className="flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors hover:bg-ink/5">
                <div className="mt-0.5 flex shrink-0 text-emerald">
                  <CheckCircle size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink line-through opacity-70">0. Boas vindas</span>
                  <span className="text-xs text-mute">10 min</span>
                </div>
              </div>

              {[
                { n: '02', t: 'Públicos que convertem' },
                { n: '03', t: 'Criativos que vendem' },
                { n: '04', t: 'Escala sem quebrar o ROAS' },
              ].map((lesson) => (
                <div
                  key={lesson.n}
                  className="flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors hover:bg-ink/5"
                >
                  <div className="mt-0.5 flex shrink-0 text-mute">
                    <MonitorPlay size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-body">
                      {lesson.n}. {lesson.t}
                    </span>
                    <span className="text-xs text-mute">35 min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
