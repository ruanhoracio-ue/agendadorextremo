import { useEffect, useState } from 'react'
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'
import { Card } from '../ui'

// ---------- Toast: confirmação curta no canto, some sozinha ----------

let proximoId = 0
let fila = []
const ouvintes = new Set()
const publicar = () => ouvintes.forEach(o => o(fila))

export function avisar(mensagem, tipo = 'sucesso') {
  const id = ++proximoId
  fila = [...fila, { id, mensagem, tipo }]
  publicar()
  // Erro fica mais tempo: precisa ser lido, não só percebido.
  setTimeout(() => dispensar(id), tipo === 'erro' ? 7000 : 3500)
}

function dispensar(id) {
  fila = fila.filter(t => t.id !== id)
  publicar()
}

export function Toasts() {
  const [itens, setItens] = useState(fila)
  useEffect(() => {
    ouvintes.add(setItens)
    return () => ouvintes.delete(setItens)
  }, [])

  return (
    <div className="ds-app pointer-events-none fixed right-4 top-4 z-toast flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" role="status" aria-live="polite">
      {itens.map(t => (
        <div key={t.id} className="ag-surgir pointer-events-auto flex items-start gap-3 rounded-md border border-hairline bg-surface px-4 py-3 shadow-lg">
          {t.tipo === 'erro'
            ? <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-danger" />
            : <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-emerald" />}
          <span className="flex-1 text-body-sm text-ink">{t.mensagem}</span>
          <button type="button" onClick={() => dispensar(t.id)} aria-label="Dispensar" className="text-mute transition-colors hover:text-ink">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ---------- Faixa: aviso que fica na tela enquanto a situação durar ----------

const tons = {
  info: { caixa: 'bg-info-soft text-info-deep', icone: Info },
  alerta: { caixa: 'bg-warning-soft text-warning-deep', icone: WarningCircle },
  erro: { caixa: 'bg-danger-soft text-danger-deep', icone: WarningCircle },
}

export function Faixa({ tom = 'info', titulo, children, acao, className }) {
  const { caixa, icone: Icone } = tons[tom]
  return (
    <div role={tom === 'erro' ? 'alert' : 'note'} className={cn('flex items-start gap-3 rounded-md px-4 py-3 text-body-sm', caixa, className)}>
      <Icone size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={cn(titulo && 'mt-0.5')}>{children}</div>}
      </div>
      {acao}
    </div>
  )
}

// ---------- Vazio: tela ou bloco sem dados, com o próximo passo ----------

export function Vazio({ icone: Icone, titulo, children, acao, className }) {
  return (
    <Card className={cn('flex flex-col items-center gap-3 py-14 text-center', className)}>
      {Icone && <Icone size={28} className="text-faint" />}
      <p className="text-label-lg text-ink">{titulo}</p>
      {children && <p className="max-w-md text-body-sm text-mute">{children}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </Card>
  )
}

export function Carregando({ texto = 'Carregando…' }) {
  return <p className="py-10 text-center text-body-sm text-mute" role="status">{texto}</p>
}
