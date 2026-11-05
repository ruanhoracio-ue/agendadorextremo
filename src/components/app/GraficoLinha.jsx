import { useEffect, useRef, useState } from 'react'
import { diaCurto } from '../../lib/datas'
import { inteiro, numero } from '../../lib/formato'

const ALTURA = 150
const MARGEM = { topo: 10, direita: 10, base: 22, esquerda: 46 }

// Passo "redondo" (1, 2 ou 5 × potência de 10): o rótulo do eixo cai
// exatamente onde a linha está, em vez de um valor arredondado à parte.
export function passoRedondo(bruto) {
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const fracao = bruto / potencia
  return (fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10) * potencia
}

function escalaY(valores) {
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const passo = passoRedondo(Math.max(max - min, 1) / 3)
  const base = Math.floor(min / passo) * passo
  let topo = Math.ceil(max / passo) * passo
  if (topo === base) topo = base + passo
  const marcas = []
  for (let v = base; v <= topo + passo / 2; v += passo) marcas.push(v)
  return { base, topo, marcas }
}

/**
 * GraficoLinha — uma série ao longo do tempo (seguidores de uma conta).
 *
 * Série única, então sem legenda: o título do cartão já diz o que é. A linha
 * usa `--chart-1`; todo texto fica em token de texto. O hover mostra o valor
 * do dia mais próximo, com o balão ao lado do ponto (nunca em cima dele).
 * `serie`: [{ data: 'YYYY-MM-DD', valor }]
 */
export function GraficoLinha({ serie, rotulo = 'seguidores' }) {
  const caixa = useRef(null)
  const [largura, setLargura] = useState(0)
  const [foco, setFoco] = useState(null)

  useEffect(() => {
    const observador = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width)))
    observador.observe(caixa.current)
    return () => observador.disconnect()
  }, [])

  if (serie.length < 2) {
    return (
      <div ref={caixa} className="flex items-center justify-center text-caption text-faint" style={{ height: ALTURA }}>
        Ainda sem histórico suficiente para o gráfico.
      </div>
    )
  }

  const { base, topo, marcas } = escalaY(serie.map(p => p.valor))
  const areaL = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1)
  const areaA = ALTURA - MARGEM.topo - MARGEM.base
  const x = (i) => MARGEM.esquerda + (i / (serie.length - 1)) * areaL
  const y = (v) => MARGEM.topo + (1 - (v - base) / (topo - base)) * areaA
  const caminho = serie.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.valor).toFixed(1)}`).join(' ')
  const ultimo = serie.length - 1
  const ativo = foco ?? ultimo

  const mover = (e) => {
    const { left } = caixa.current.getBoundingClientRect()
    const fracao = (e.clientX - left - MARGEM.esquerda) / areaL
    setFoco(Math.min(ultimo, Math.max(0, Math.round(fracao * ultimo))))
  }

  return (
    <div ref={caixa} className="relative" style={{ height: ALTURA }}>
      {largura > 0 && (
        <svg width={largura} height={ALTURA} role="img" aria-label={`Evolução de ${rotulo}: de ${inteiro(serie[0].valor)} em ${diaCurto(serie[0].data)} para ${inteiro(serie[ultimo].valor)} em ${diaCurto(serie[ultimo].data)}.`}>
          {marcas.map(v => (
            <g key={v}>
              <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(v)} y2={y(v)} className="stroke-hairline" strokeWidth="1" />
              <text x={MARGEM.esquerda - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-mute text-[11px] tabular-nums">{numero(v)}</text>
            </g>
          ))}
          <text x={MARGEM.esquerda} y={ALTURA - 5} className="fill-mute text-[11px]">{diaCurto(serie[0].data)}</text>
          <text x={largura - MARGEM.direita} y={ALTURA - 5} textAnchor="end" className="fill-mute text-[11px]">{diaCurto(serie[ultimo].data)}</text>

          <path d={caminho} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {foco !== null && <line x1={x(foco)} x2={x(foco)} y1={MARGEM.topo} y2={ALTURA - MARGEM.base} className="stroke-hairline-strong" strokeWidth="1" />}
          {/* Marcador com anel na cor da superfície, para se destacar da linha. */}
          <circle cx={x(ativo)} cy={y(serie[ativo].valor)} r="4" fill="var(--chart-1)" className="stroke-surface" strokeWidth="2" />

          <rect x={MARGEM.esquerda} y={0} width={areaL} height={ALTURA} fill="transparent" onPointerMove={mover} onPointerLeave={() => setFoco(null)} />
        </svg>
      )}

      {foco !== null && (
        <div
          className="pointer-events-none absolute top-1 rounded-sm border border-hairline bg-surface px-2.5 py-1.5 shadow-md"
          style={x(foco) > largura / 2 ? { right: largura - x(foco) + 10 } : { left: x(foco) + 10 }}
        >
          <p className="text-caption text-mute">{diaCurto(serie[foco].data)}</p>
          <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-ink">{inteiro(serie[foco].valor)} <span className="font-normal text-mute">{rotulo}</span></p>
        </div>
      )}
    </div>
  )
}
