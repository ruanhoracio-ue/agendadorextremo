import { useEffect, useRef, useState } from 'react'
import { passoRedondo } from './GraficoLinha'
import { diaCurto } from '../../lib/datas'
import { inteiro, numero } from '../../lib/formato'

const ALTURA = 220
const MARGEM = { topo: 10, direita: 10, base: 24, esquerda: 50 }
const LARGURA_MAXIMA = 24 // a coluna nunca preenche a faixa: o resto é ar

/**
 * GraficoColunas — um valor por dia (ex.: visualizações dos posts publicados
 * em cada dia). Série única, sem legenda. O eixo começa no zero, a coluna é
 * arredondada só na ponta do dado, e o hover vale para a faixa inteira do
 * dia, com o balão ao lado.
 * `serie`: [{ data: 'YYYY-MM-DD', valor, detalhe? }]
 */
export function GraficoColunas({ serie, rotulo, vazio = 'Sem dados no período.' }) {
  const caixa = useRef(null)
  const [largura, setLargura] = useState(0)
  const [foco, setFoco] = useState(null)

  useEffect(() => {
    const observador = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width)))
    observador.observe(caixa.current)
    return () => observador.disconnect()
  }, [])

  const maximo = Math.max(0, ...serie.map(p => p.valor))
  if (maximo === 0) {
    return <div ref={caixa} className="flex items-center justify-center text-body-sm text-mute" style={{ height: ALTURA }}>{vazio}</div>
  }

  const passo = passoRedondo(maximo / 4)
  const topo = Math.ceil(maximo / passo) * passo
  const marcas = []
  for (let v = 0; v <= topo + passo / 2; v += passo) marcas.push(v)

  const areaL = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1)
  const areaA = ALTURA - MARGEM.topo - MARGEM.base
  const faixa = areaL / serie.length
  const coluna = Math.max(2, Math.min(LARGURA_MAXIMA, faixa * 0.6))
  const y = (v) => MARGEM.topo + (1 - v / topo) * areaA
  const base = y(0)
  // Rótulos do eixo x: primeiro, meio e último dia, para não amontoar.
  const marcados = [...new Set([0, Math.floor((serie.length - 1) / 2), serie.length - 1])]

  return (
    <div ref={caixa} className="relative" style={{ height: ALTURA }}>
      {largura > 0 && (
        <svg width={largura} height={ALTURA} role="img" aria-label={`${rotulo} por dia, de ${diaCurto(serie[0].data)} a ${diaCurto(serie[serie.length - 1].data)}. Maior valor: ${inteiro(maximo)}.`}>
          {marcas.map(v => (
            <g key={v}>
              <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(v)} y2={y(v)} className={v === 0 ? 'stroke-hairline-strong' : 'stroke-hairline'} strokeWidth="1" />
              <text x={MARGEM.esquerda - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-mute text-[11px] tabular-nums">{numero(v)}</text>
            </g>
          ))}

          {serie.map((p, i) => {
            const x = MARGEM.esquerda + i * faixa
            const altura = base - y(p.valor)
            const raio = Math.min(4, coluna / 2, altura)
            const esquerda = x + (faixa - coluna) / 2
            return (
              <g key={p.data} onPointerEnter={() => setFoco(i)} onPointerLeave={() => setFoco(null)}>
                {/* Alvo do hover: a faixa inteira do dia, não só a coluna pintada. */}
                <rect x={x} y={MARGEM.topo} width={faixa} height={areaA} className={foco === i ? 'fill-ink/[0.04]' : 'fill-transparent'} />
                {p.valor > 0 && (
                  <path
                    d={`M${esquerda} ${base} V${base - altura + raio} Q${esquerda} ${base - altura} ${esquerda + raio} ${base - altura} H${esquerda + coluna - raio} Q${esquerda + coluna} ${base - altura} ${esquerda + coluna} ${base - altura + raio} V${base} Z`}
                    fill="var(--chart-1)"
                  />
                )}
                {marcados.includes(i) && (
                  <text x={x + faixa / 2} y={ALTURA - 6} textAnchor={i === 0 ? 'start' : i === serie.length - 1 ? 'end' : 'middle'} className="fill-mute text-[11px]">{diaCurto(p.data)}</text>
                )}
              </g>
            )
          })}
        </svg>
      )}

      {foco !== null && (() => {
        const centro = MARGEM.esquerda + (foco + 0.5) * faixa
        return (
          <div
            className="pointer-events-none absolute top-1 rounded-sm border border-hairline bg-surface px-2.5 py-1.5 shadow-md"
            style={centro > largura / 2 ? { right: largura - centro + faixa / 2 + 6 } : { left: centro + faixa / 2 + 6 }}
          >
            <p className="text-caption text-mute">{diaCurto(serie[foco].data)}</p>
            <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-ink">{inteiro(serie[foco].valor)} <span className="font-normal text-mute">{rotulo.toLowerCase()}</span></p>
            {serie[foco].detalhe && <p className="whitespace-nowrap text-caption text-mute">{serie[foco].detalhe}</p>}
          </div>
        )
      })()}
    </div>
  )
}
