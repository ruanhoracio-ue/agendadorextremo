import { useEffect, useState } from 'react'
import { ArrowsClockwise, Plus, PlugsConnected } from '@phosphor-icons/react'
import { Button, Card, Field, Input, Select } from '../components/ui'
import { Modal, Confirmar } from '../components/app/Modal'
import { Faixa, avisar } from '../components/app/Avisos'
import { IconeRede } from '../components/app/IconeRede'
import { api } from '../lib/api'
import { useApp } from '../lib/contexto'
import { useDados } from '../lib/useDados'
import { REDES, rede } from '../lib/redes'
import { inteiro } from '../lib/formato'
import { cn } from '../lib/cn'

const dataCurta = (iso) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))

/**
 * Contas conectadas — uma grade com um cartão por rede. Cada cartão diz se a
 * rede está conectada, lista as contas e tem o seu próprio botão de conectar.
 */
export default function Contas() {
  const { estado, recarregarEstado, contas, contasErro, recarregarContas, definirAcoes } = useApp()
  const perfis = useDados(() => api.perfis(), [])
  const [conectando, setConectando] = useState(null)
  const [removendo, setRemovendo] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [novoPerfil, setNovoPerfil] = useState(null) // null = fechado; string = nome digitado

  // Volta do login da rede: o Zernio devolve a pessoa para /contas?conectada=…
  // (ou com ?error=… quando ela cancela ou a rede recusa).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (![...q.keys()].length) return
    if (q.get('error')) avisar(`A conexão não foi concluída (${q.get('error')}).`, 'erro')
    else if (q.get('conectada')) {
      avisar(`Conta do ${rede(q.get('conectada')).nome} conectada.`)
      recarregarContas({ silencioso: true })
    }
    window.history.replaceState(null, '', window.location.pathname)
  }, [recarregarContas])

  useEffect(() => {
    definirAcoes(<Button variant="secondary" size="field" icon={<Plus size={14} weight="bold" />} onClick={() => setNovoPerfil('')}>Novo perfil</Button>)
    return () => definirAcoes(null)
  }, [definirAcoes])

  const conectar = async (plataforma, opcoes = {}) => {
    setConectando(opcoes.reconectar || `${plataforma}:${opcoes.metodo || ''}`)
    try {
      const { url } = await api.conectar(plataforma, opcoes)
      if (!/^https:\/\//.test(url || '')) throw new Error('O Zernio não devolveu um endereço de conexão válido.')
      // Sai do app para a tela oficial de login da rede; ela devolve para cá.
      window.location.href = url
    } catch (falha) {
      avisar(falha.message, 'erro')
      setConectando(null)
    }
  }

  const desconectar = async () => {
    setOcupado(true)
    try {
      await api.desconectar(removendo.id)
      avisar('Conta desconectada.')
      await recarregarContas({ silencioso: true })
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setOcupado(false)
      setRemovendo(null)
    }
  }

  const trocarPerfil = async (perfilId) => {
    try {
      await api.salvarConfig({ perfilId: perfilId || null })
      await recarregarEstado()
      recarregarContas({ silencioso: true })
    } catch (falha) {
      avisar(falha.message, 'erro')
    }
  }

  const criarPerfil = async (e) => {
    e.preventDefault()
    setOcupado(true)
    try {
      const { perfil } = await api.criarPerfil(novoPerfil)
      avisar(`Perfil "${perfil.nome}" criado.`)
      setNovoPerfil(null)
      await perfis.recarregar({ silencioso: true })
      if (estado.podeSalvar) await trocarPerfil(perfil.id)
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setOcupado(false)
    }
  }

  // Redes do app na ordem fixa, mais qualquer rede que já tenha conta
  // conectada pelo painel do Zernio e que o app não conecta sozinho.
  const plataformas = [...Object.keys(REDES), ...new Set(contas.map(c => c.plataforma).filter(p => !REDES[p]))]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Select aria-label="Perfil do Zernio" value={estado.perfilId || ''} disabled={!estado.podeSalvar || perfis.carregando} onChange={(e) => trocarPerfil(e.target.value)}>
            <option value="">Todos os perfis</option>
            {(perfis.dados?.perfis || []).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Select>
        </div>
        <p className="text-body-sm text-mute">
          As 2 primeiras contas são gratuitas no Zernio; da 3ª à 10ª, US$ 6 por mês cada.
        </p>
      </div>

      {contasErro && (
        <Faixa tom="erro" titulo="Não consegui carregar as contas." acao={<Button variant="ghost" size="sm" onClick={() => recarregarContas()}>Tentar de novo</Button>}>
          {contasErro.message}
        </Faixa>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {plataformas.map(plataforma => {
          const r = rede(plataforma)
          const daRede = contas.filter(c => c.plataforma === plataforma)
          const conectada = daRede.length > 0
          const podeConectar = Boolean(REDES[plataforma])
          return (
            <Card as="li" key={plataforma} className="flex min-h-44 flex-col gap-4 p-4!">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald/[0.08] text-ink">
                  <IconeRede plataforma={plataforma} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label-lg text-ink">{r.nome}</p>
                  <p className="flex items-center gap-1.5 text-caption text-mute">
                    <span className={cn('h-1.5 w-1.5 rounded-full', conectada ? 'bg-success' : 'bg-faint')} aria-hidden="true" />
                    {conectada ? `${daRede.length} ${daRede.length === 1 ? 'conta conectada' : 'contas conectadas'}` : 'Não conectada'}
                  </p>
                </div>
              </div>

              {conectada ? (
                <ul className="flex flex-col gap-2">
                  {daRede.map(c => (
                    <li key={c.id} className="flex items-center gap-2.5 rounded-md border border-hairline px-2.5 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-mute">
                        {c.foto ? <img src={c.foto} alt="" className="h-full w-full object-cover" /> : <IconeRede plataforma={plataforma} size={15} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{c.usuario || c.nome}</span>
                        <span className="block truncate text-caption text-mute">
                          {[c.seguidores !== null && `${inteiro(c.seguidores)} seguidores`, c.conectadaEm && `desde ${dataCurta(c.conectadaEm)}`].filter(Boolean).join(' · ') || 'Conectada'}
                        </span>
                      </span>
                      {/* Conta saudável não leva selo: o cabeçalho do cartão já diz
                          "conectada", e o espaço fica para o nome. */}
                      {c.precisaReconectar && (
                        <Button variant="secondary" size="sm" className="px-3! py-1.5!" disabled={conectando === c.id} onClick={() => conectar(plataforma, { reconectar: c.id })} icon={<ArrowsClockwise size={13} />}>
                          Reconectar
                        </Button>
                      )}
                      <button type="button" onClick={() => setRemovendo(c)} aria-label={`Desconectar ${c.usuario || r.nome}`} title="Desconectar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-mute transition-colors hover:bg-elevated hover:text-danger">
                        <PlugsConnected size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                r.obs && <p className="text-caption text-mute">{r.obs}</p>
              )}

              {podeConectar && (
                <div className="mt-auto flex gap-2">
                  {plataforma === 'instagram' ? (
                    /* O Instagram tem dois caminhos de login. O direto serve para a
                       maioria; pelo Facebook é para conta ligada a uma Página. */
                    <>
                      <Button variant="secondary" size="field" className="flex-1" disabled={Boolean(conectando)} onClick={() => conectar('instagram')}>
                        {conectando === 'instagram:' ? 'Abrindo…' : 'Via Instagram'}
                      </Button>
                      <Button variant="secondary" size="field" className="flex-1" disabled={Boolean(conectando)} onClick={() => conectar('instagram', { metodo: 'facebook' })}>
                        {conectando === 'instagram:facebook' ? 'Abrindo…' : 'Via Facebook'}
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" size="field" className="w-full" disabled={Boolean(conectando)} onClick={() => conectar(plataforma)}>
                      {conectando === `${plataforma}:` ? 'Abrindo…' : conectada ? '+ Conectar outra conta' : '+ Conectar'}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </ul>

      <Modal
        aberto={novoPerfil !== null}
        aoFechar={() => setNovoPerfil(null)}
        titulo="Novo perfil"
        tamanho="sm"
        rodape={
          <>
            <Button variant="ghost" size="field" onClick={() => setNovoPerfil(null)}>Cancelar</Button>
            <Button size="field" type="submit" form="form-novo-perfil" disabled={ocupado || !novoPerfil?.trim()}>Criar perfil</Button>
          </>
        }
      >
        <form id="form-novo-perfil" onSubmit={criarPerfil} className="flex flex-col gap-3">
          <p className="text-body-sm text-mute">Um perfil agrupa as contas de uma marca ou de um cliente. As contas que você conectar depois entram no perfil selecionado.</p>
          <Field label="Nome do perfil">
            <Input autoFocus value={novoPerfil || ''} onChange={(e) => setNovoPerfil(e.target.value)} placeholder="Ex.: Tiago Tessmann" />
          </Field>
        </form>
      </Modal>

      <Confirmar
        aberto={Boolean(removendo)}
        aoFechar={() => setRemovendo(null)}
        aoConfirmar={desconectar}
        titulo={`Desconectar ${removendo?.usuario || 'esta conta'}?`}
        acao="Desconectar"
        ocupado={ocupado}
      >
        Os posts agendados para esta conta deixam de sair. Reconectando em até 1 hora, a conta e os agendamentos voltam; depois disso o Zernio apaga de vez.
      </Confirmar>
    </div>
  )
}
