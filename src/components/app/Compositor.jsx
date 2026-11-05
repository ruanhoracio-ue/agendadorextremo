import { useEffect, useMemo, useRef, useState } from 'react'
import { UploadSimple, FilmStrip, X, WarningCircle, CheckCircle, FolderOpen } from '@phosphor-icons/react'
import { Button, Field, Input, Select, SegmentedControl } from '../ui'
import { Modal } from './Modal'
import { Faixa, avisar } from './Avisos'
import { IconeRede } from './IconeRede'
import { SeletorDoHub } from './SeletorDoHub'
import { classeCampo } from './campos'
import { api, enviarArquivo } from '../../lib/api'
import { useApp } from '../../lib/contexto'
import { rede, pendencias } from '../../lib/redes'
import { paraCampo } from '../../lib/datas'
import { tamanhoArquivo } from '../../lib/formato'
import { cn } from '../../lib/cn'

const MODOS = [
  { value: 'agendar', label: 'Agendar' },
  { value: 'agora', label: 'Publicar agora' },
  { value: 'rascunho', label: 'Rascunho' },
]
const ACEITOS = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm'
const TIKTOK_PADRAO = {
  privacyLevel: 'PUBLIC_TO_EVERYONE', allowComment: true, allowDuet: true, allowStitch: true,
  contentPreviewConfirmed: true, expressConsentGiven: true,
}

let proximaMidia = 0

function estadoInicial({ post, dia, fuso }) {
  if (post) {
    const dados = (plataforma) => post.destinos.find(d => d.plataforma === plataforma)?.dados || {}
    return {
      conteudo: post.conteudo,
      midias: post.midias.filter(m => m.url).map(m => ({ ...m, id: ++proximaMidia, previa: m.miniatura, progresso: null, erro: null })),
      selecionadas: post.destinos.map(d => d.contaId),
      story: dados('instagram').contentType === 'story',
      tituloYoutube: dados('youtube').title || '',
      visibilidade: dados('youtube').visibility || 'public',
      aceiteTiktok: Boolean(post.tiktok?.expressConsentGiven),
      modo: post.status === 'draft' ? 'rascunho' : 'agendar',
      quando: paraCampo(post.agendadoPara, fuso),
      porRede: Object.fromEntries(post.destinos.filter(d => d.conteudo).map(d => [d.plataforma, d.conteudo])),
      personalizar: post.destinos.some(d => d.conteudo),
      hub: post.hubVideoId ? { id: post.hubVideoId, titulo: null } : null,
    }
  }
  return {
    conteudo: '', midias: [], selecionadas: [], story: false, tituloYoutube: '', visibilidade: 'public',
    aceiteTiktok: false, modo: 'agendar', quando: dia ? `${dia}T09:00` : '',
    porRede: {}, personalizar: false, hub: null,
  }
}

/**
 * Compositor — criar ou editar um post.
 * `post` preenchido = edição; `dia` = data sugerida ao clicar num dia do calendário.
 */
export function Compositor({ aberto, aoFechar, aoSalvar, post, dia }) {
  const { contas, fuso, estado } = useApp()
  const [f, setF] = useState(() => estadoInicial({ post, dia, fuso }))
  const [escolhendoDoHub, setEscolhendoDoHub] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const idempotencia = useRef(null)
  const arquivo = useRef(null)

  // Cada abertura começa do zero (ou do post em edição) e ganha uma chave de
  // idempotência própria: repetir o envio do mesmo formulário não duplica.
  useEffect(() => {
    if (!aberto) return
    setF(estadoInicial({ post, dia, fuso }))
    setErro(null)
    setEnviando(false)
    idempotencia.current = crypto.randomUUID()
  }, [aberto, post, dia, fuso])

  const mudar = (parte) => setF(atual => ({ ...atual, ...parte }))
  const mudarMidia = (id, parte) => setF(atual => ({ ...atual, midias: atual.midias.map(m => (m.id === id ? { ...m, ...parte } : m)) }))

  const destinos = useMemo(() => contas
    .filter(c => f.selecionadas.includes(c.id))
    .map(c => ({
      plataforma: c.plataforma,
      contaId: c.id,
      conteudo: (f.personalizar && f.porRede[c.plataforma]?.trim()) || undefined,
      dados: c.plataforma === 'instagram' ? (f.story ? { contentType: 'story' } : {})
        : c.plataforma === 'youtube' ? { title: f.tituloYoutube.trim(), visibility: f.visibilidade }
        : {},
    })), [contas, f.selecionadas, f.story, f.tituloYoutube, f.visibilidade, f.personalizar, f.porRede])

  const redesEscolhidas = [...new Set(destinos.map(d => d.plataforma))]

  const tem = (plataforma) => destinos.some(d => d.plataforma === plataforma)
  const subindo = f.midias.some(m => m.progresso !== null)
  const midiasProntas = f.midias.filter(m => m.url)

  const faltas = useMemo(() => {
    if (f.modo === 'rascunho') return []
    const lista = pendencias({ destinos, midias: midiasProntas, conteudo: f.conteudo })
    if (destinos.length === 0) lista.unshift('Escolha pelo menos uma conta.')
    if (f.modo === 'agendar') {
      if (!f.quando) lista.push('Informe a data e a hora.')
      else if (f.quando <= paraCampo(new Date().toISOString(), fuso)) lista.push('A data do agendamento já passou.')
    }
    if (tem('youtube') && f.tituloYoutube.trim().length > 100) lista.push('O título do YouTube passa de 100 caracteres.')
    if (tem('tiktok') && !f.aceiteTiktok) lista.push('Marque a confirmação do TikTok.')
    return lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, destinos, midiasProntas.length, fuso])

  const alternarConta = (id) => mudar({
    selecionadas: f.selecionadas.includes(id) ? f.selecionadas.filter(x => x !== id) : [...f.selecionadas, id],
  })

  const adicionarArquivos = (lista) => {
    for (const arq of lista) {
      const id = ++proximaMidia
      const tipo = arq.type.startsWith('video/') ? 'video' : 'image'
      const previa = tipo === 'image' ? URL.createObjectURL(arq) : null
      setF(atual => ({ ...atual, midias: [...atual.midias, { id, tipo, nome: arq.name, tamanho: arq.size, mime: arq.type, url: null, previa, progresso: 0, erro: null }] }))
      enviarArquivo(arq, (p) => mudarMidia(id, { progresso: p }))
        .then(pronto => mudarMidia(id, { ...pronto, progresso: null }))
        .catch(falha => mudarMidia(id, { progresso: null, erro: falha.message }))
    }
  }

  const enviar = async () => {
    setEnviando(true)
    setErro(null)
    const corpo = {
      conteudo: f.conteudo,
      midias: midiasProntas.map(({ tipo, url, nome, tamanho, mime }) => ({ tipo, url, nome, tamanho, mime })),
      destinos,
      modo: f.modo,
      agendadoPara: f.modo === 'agora' ? undefined : f.quando || undefined,
      tiktok: tem('tiktok') && f.aceiteTiktok ? TIKTOK_PADRAO : undefined,
      hubVideoId: f.hub?.id,
    }
    try {
      const { avisos } = post ? await api.atualizarPost(post.id, corpo) : await api.criarPost(corpo, idempotencia.current)
      avisar(f.modo === 'agora' ? 'Post enviado para publicação.' : f.modo === 'rascunho' ? 'Rascunho salvo.' : 'Post agendado.')
      for (const aviso of avisos || []) avisar(aviso, 'erro')
      aoSalvar()
    } catch (falha) {
      setErro(falha.message)
      setEnviando(false)
    }
  }

  const rotuloBotao = enviando ? 'Enviando…' : f.modo === 'agora' ? 'Publicar agora' : f.modo === 'rascunho' ? 'Salvar rascunho' : post ? 'Salvar agendamento' : 'Agendar post'

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={post ? 'Editar post' : 'Novo post'}
      tamanho="lg"
      rodape={
        <>
          <Button variant="ghost" size="field" onClick={aoFechar}>Cancelar</Button>
          <Button size="field" onClick={enviar} disabled={enviando || subindo || faltas.length > 0}>{rotuloBotao}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* CONTENT-HUB — começa o post a partir de um vídeo aprovado lá */}
        {estado.hub?.configurada && (
          f.hub ? (
            <Faixa
              tom="info"
              acao={<button type="button" aria-label="Desvincular do content-hub" onClick={() => mudar({ hub: null })} className="text-info-deep/70 transition-colors hover:text-info-deep"><X size={14} /></button>}
            >
              Vídeo do content-hub{f.hub.titulo ? <>: <strong>{f.hub.titulo}</strong></> : ''}. Ao agendar, ele passa para "Agendado" lá; quando for ao ar, para "Publicado" com o link.
            </Faixa>
          ) : !post && (
            <div>
              <Button variant="secondary" size="sm" onClick={() => setEscolhendoDoHub(true)}>
                <FolderOpen size={15} /> Puxar vídeo aprovado do content-hub
              </Button>
            </div>
          )
        )}

        {/* CONTAS */}
        <fieldset>
          <legend className="text-xs font-medium text-mute">Publicar em</legend>
          {contas.length === 0 ? (
            <Faixa tom="info" className="mt-2">Nenhuma conta conectada ainda. Conecte em Contas conectadas; por enquanto dá para salvar como rascunho.</Faixa>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {contas.map(c => {
                const marcada = f.selecionadas.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="checkbox"
                    aria-checked={marcada}
                    disabled={c.precisaReconectar}
                    title={c.precisaReconectar ? 'Esta conta precisa ser reconectada em Contas conectadas.' : undefined}
                    onClick={() => alternarConta(c.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      marcada ? 'border-emerald bg-emerald/10 text-emerald-deep' : 'border-hairline bg-surface text-body hover:bg-elevated hover:text-ink',
                    )}
                  >
                    <IconeRede plataforma={c.plataforma} size={16} />
                    <span className="max-w-[14rem] truncate">{c.usuario || rede(c.plataforma).nome}</span>
                    {marcada && <CheckCircle size={14} weight="fill" />}
                  </button>
                )
              })}
            </div>
          )}
        </fieldset>

        {/* LEGENDA */}
        <Field label="Legenda">
          <textarea
            rows={5}
            value={f.conteudo}
            onChange={(e) => mudar({ conteudo: e.target.value })}
            placeholder="Escreva o texto do post. Hashtags entram aqui mesmo."
            className={cn(classeCampo, 'resize-y py-2.5 leading-relaxed')}
          />
          <span className="self-end text-caption tabular-nums text-faint">{f.conteudo.length.toLocaleString('pt-BR')} caracteres</span>
        </Field>

        {/* LEGENDA POR REDE — só faz sentido com mais de uma rede escolhida */}
        {(redesEscolhidas.length > 1 || f.personalizar) && (
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 text-body-sm text-body">
              <input type="checkbox" checked={f.personalizar} onChange={(e) => mudar({ personalizar: e.target.checked })} className="mt-1 accent-emerald" />
              <span><span className="font-medium text-ink">Usar um texto diferente em cada rede.</span> A rede que ficar em branco usa a legenda de cima.</span>
            </label>
            {f.personalizar && redesEscolhidas.map(plataforma => (
              <label key={plataforma} className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-mute"><IconeRede plataforma={plataforma} size={14} />{rede(plataforma).nome}</span>
                <textarea
                  rows={3}
                  value={f.porRede[plataforma] || ''}
                  onChange={(e) => mudar({ porRede: { ...f.porRede, [plataforma]: e.target.value } })}
                  placeholder="Em branco, usa a legenda de cima"
                  className={cn(classeCampo, 'resize-y py-2.5 leading-relaxed')}
                />
              </label>
            ))}
          </div>
        )}

        {/* MÍDIA */}
        <div>
          <span className="text-xs font-medium text-mute">Imagens e vídeos</span>
          <div
            className="mt-2 flex flex-col items-center gap-2 rounded-md border border-dashed border-hairline-strong px-4 py-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); adicionarArquivos([...e.dataTransfer.files]) }}
          >
            <UploadSimple size={22} className="text-faint" />
            <p className="text-body-sm text-mute">Arraste os arquivos para cá ou</p>
            <Button variant="secondary" size="sm" onClick={() => arquivo.current?.click()}>Escolher arquivos</Button>
            <input ref={arquivo} type="file" multiple accept={ACEITOS} className="hidden" onChange={(e) => { adicionarArquivos([...e.target.files]); e.target.value = '' }} />
          </div>

          {f.midias.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {f.midias.map(m => (
                <li key={m.id} className="flex items-center gap-3 rounded-md border border-hairline px-3 py-2">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-elevated text-mute">
                    {m.previa ? <img src={m.previa} alt="" className="h-full w-full object-cover" /> : <FilmStrip size={20} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{m.nome || (m.tipo === 'video' ? 'Vídeo' : 'Imagem')}</span>
                    {m.erro ? (
                      <span className="flex items-center gap-1 text-caption text-danger-deep"><WarningCircle size={12} />{m.erro}</span>
                    ) : m.progresso !== null ? (
                      <span className="mt-1 block h-1 overflow-hidden rounded-full bg-elevated" role="progressbar" aria-valuenow={Math.round(m.progresso * 100)} aria-valuemin={0} aria-valuemax={100}>
                        <span className="block h-full bg-emerald transition-[width]" style={{ width: `${Math.round(m.progresso * 100)}%` }} />
                      </span>
                    ) : (
                      <span className="text-caption text-mute">{[m.tipo === 'video' ? 'Vídeo' : 'Imagem', tamanhoArquivo(m.tamanho)].filter(Boolean).join(' · ')}</span>
                    )}
                  </span>
                  <button type="button" aria-label={`Remover ${m.nome || 'arquivo'}`} onClick={() => mudar({ midias: f.midias.filter(x => x.id !== m.id) })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-mute transition-colors hover:bg-elevated hover:text-ink">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* OPÇÕES POR REDE — só aparecem para as redes escolhidas */}
        {tem('instagram') && (
          <label className="flex items-start gap-3 text-body-sm text-body">
            <input type="checkbox" checked={f.story} onChange={(e) => mudar({ story: e.target.checked })} className="mt-1 accent-emerald" />
            <span><span className="font-medium text-ink">Instagram: publicar como Story.</span> Desmarcado, um vídeo sai como Reel e imagens saem no feed (várias viram carrossel).</span>
          </label>
        )}

        {tem('youtube') && (
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <Field label="YouTube: título do vídeo">
              <Input value={f.tituloYoutube} maxLength={120} onChange={(e) => mudar({ tituloYoutube: e.target.value })} placeholder="Em branco, usa a primeira linha da legenda" />
            </Field>
            <Field label="Visibilidade">
              <Select value={f.visibilidade} onChange={(e) => mudar({ visibilidade: e.target.value })}>
                <option value="public">Público</option>
                <option value="unlisted">Não listado</option>
                <option value="private">Privado</option>
              </Select>
            </Field>
          </div>
        )}

        {tem('tiktok') && (
          <label className="flex items-start gap-3 text-body-sm text-body">
            <input type="checkbox" checked={f.aceiteTiktok} onChange={(e) => mudar({ aceiteTiktok: e.target.checked })} className="mt-1 accent-emerald" />
            <span><span className="font-medium text-ink">TikTok: revisei o conteúdo e autorizo a publicação.</span> O TikTok exige essa confirmação. O vídeo sai público, com comentários, dueto e costura liberados.</span>
          </label>
        )}

        {/* QUANDO */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-mute">Quando</span>
            <SegmentedControl ariaLabel="Quando publicar" options={MODOS} value={f.modo} onChange={(modo) => mudar({ modo })} />
          </div>
          {f.modo !== 'agora' && (
            <Field label={f.modo === 'rascunho' ? 'Data prevista (opcional)' : `Data e hora (${fuso.replace('_', ' ')})`}>
              <input type="datetime-local" value={f.quando} onChange={(e) => mudar({ quando: e.target.value })} className={cn(classeCampo, 'h-[var(--ds-input-height)] w-auto')} />
            </Field>
          )}
        </div>

        {f.modo === 'agora' && <Faixa tom="alerta">O post vai para as redes assim que você clicar em Publicar agora. Não dá para desfazer por aqui.</Faixa>}
        {faltas.length > 0 && (
          <Faixa tom="info" titulo="Falta para liberar o envio:">
            <ul className="list-disc pl-4">{faltas.map(x => <li key={x}>{x}</li>)}</ul>
          </Faixa>
        )}
        {erro && <Faixa tom="erro" titulo="O envio não foi aceito.">{erro}</Faixa>}
      </div>

      <SeletorDoHub
        aberto={escolhendoDoHub}
        aoFechar={() => setEscolhendoDoHub(false)}
        aoEscolher={({ video, legenda }) => {
          setEscolhendoDoHub(false)
          mudar({
            hub: { id: video.id, titulo: video.titulo },
            conteudo: f.conteudo.trim() ? f.conteudo : legenda,
            // O vídeo não é enviado de novo: o Zernio busca direto no content-hub.
            midias: [{ id: ++proximaMidia, tipo: 'video', url: video.linkVideo, nome: `${video.titulo}.mp4`, tamanho: null, mime: 'video/mp4', previa: null, progresso: null, erro: null }],
          })
        }}
      />
    </Modal>
  )
}
