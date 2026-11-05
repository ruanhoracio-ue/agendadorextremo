import { useState } from 'react'
import { FilmStrip, MagnifyingGlass } from '@phosphor-icons/react'
import { Badge, Button, Input } from '../ui'
import { Modal } from './Modal'
import { Faixa, Carregando } from './Avisos'
import { api } from '../../lib/api'
import { useDados } from '../../lib/useDados'

/**
 * SeletorDoHub — escolhe um vídeo aprovado no content-hub para virar post.
 * Devolve o vídeo e o texto do .txt de legendas dele (quando existe).
 */
export function SeletorDoHub({ aberto, aoFechar, aoEscolher }) {
  const [busca, setBusca] = useState('')
  const [pegando, setPegando] = useState(null)
  const [erro, setErro] = useState(null)
  const videos = useDados(() => api.videosDoHub(), [aberto], { ativo: aberto })

  const lista = (videos.dados?.videos || []).filter(v => v.titulo.toLowerCase().includes(busca.trim().toLowerCase()))

  const escolher = async (video) => {
    setPegando(video.id)
    setErro(null)
    try {
      const { legenda } = video.temLegenda ? await api.legendaDoHub(video.id) : { legenda: '' }
      aoEscolher({ video, legenda })
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setPegando(null)
    }
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Vídeos aprovados no content-hub">
      <div className="flex flex-col gap-4">
        <Input icon={<MagnifyingGlass size={15} />} placeholder="Filtrar pelo título" value={busca} onChange={(e) => setBusca(e.target.value)} />
        {erro && <Faixa tom="erro">{erro}</Faixa>}

        {videos.erro ? (
          <Faixa tom="erro" titulo="Não consegui ler o content-hub.">{videos.erro.message}</Faixa>
        ) : videos.carregando && !videos.dados ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-mute">
            {busca ? 'Nenhum vídeo aprovado com esse título.' : 'Nenhum vídeo com status "Aprovado" no content-hub agora.'}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline rounded-md border border-hairline">
            {lista.map(v => (
              <li key={v.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-elevated text-mute"><FilmStrip size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{v.titulo}</span>
                  <span className="flex items-center gap-2 text-caption text-mute">
                    {v.categoria || 'Vídeo curto'}
                    {!v.temLegenda && <span>· sem legenda anexada</span>}
                  </span>
                </span>
                {v.linkVideo
                  ? <Button variant="secondary" size="sm" disabled={Boolean(pegando)} onClick={() => escolher(v)}>{pegando === v.id ? 'Abrindo…' : 'Usar'}</Button>
                  : <Badge tone="warning">Sem arquivo final</Badge>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
