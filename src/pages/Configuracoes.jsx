import { useState } from 'react'
import { Badge, Button, Card, Field, Heading, Input, Select, Text } from '../components/ui'
import { Confirmar } from '../components/app/Modal'
import { Faixa, avisar } from '../components/app/Avisos'
import { api } from '../lib/api'
import { useApp } from '../lib/contexto'

const FUSOS = [
  ['America/Sao_Paulo', 'Brasília (São Paulo, Rio, Sul, Nordeste)'],
  ['America/Manaus', 'Manaus (Amazonas, Rondônia, Roraima)'],
  ['America/Cuiaba', 'Cuiabá (Mato Grosso, Mato Grosso do Sul)'],
  ['America/Rio_Branco', 'Rio Branco (Acre)'],
  ['America/Noronha', 'Fernando de Noronha'],
  ['Europe/Lisbon', 'Lisboa'],
  ['America/New_York', 'Nova York'],
]

export default function Configuracoes() {
  const { estado, recarregarEstado, recarregarContas } = useApp()
  const { chave, podeSalvar } = estado

  const [novaChave, setNovaChave] = useState('')
  const [trocando, setTrocando] = useState(!chave.configurada)
  const [salvando, setSalvando] = useState(false)
  const [erroChave, setErroChave] = useState(null)
  const [removendo, setRemovendo] = useState(false)

  const hub = estado.hub || {}
  const [chaveHub, setChaveHub] = useState('')
  const [salvandoHub, setSalvandoHub] = useState(false)
  const [erroHub, setErroHub] = useState(null)

  const salvarHub = async (e) => {
    e.preventDefault()
    setSalvandoHub(true)
    setErroHub(null)
    try {
      await api.salvarConfig({ hubKey: chaveHub })
      avisar('Chave conferida no content-hub e salva.')
      setChaveHub('')
      await recarregarEstado()
    } catch (falha) {
      setErroHub(falha.message)
    } finally {
      setSalvandoHub(false)
    }
  }

  const removerHub = async () => {
    try {
      await api.removerChaveHub()
      avisar('Ligação com o content-hub removida.')
      await recarregarEstado()
    } catch (falha) {
      avisar(falha.message, 'erro')
    }
  }

  const aplicar = async (mudancas, mensagem) => {
    try {
      await api.salvarConfig(mudancas)
      avisar(mensagem)
      await recarregarEstado()
      recarregarContas({ silencioso: true })
      return true
    } catch (falha) {
      avisar(falha.message, 'erro')
      return false
    }
  }

  const salvarChave = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErroChave(null)
    try {
      await api.salvarConfig({ apiKey: novaChave })
      avisar('Chave conferida no Zernio e salva.')
      setNovaChave('')
      setTrocando(false)
      await recarregarEstado()
    } catch (falha) {
      setErroChave(falha.message)
    } finally {
      setSalvando(false)
    }
  }

  const removerChave = async () => {
    try {
      await api.removerChave()
      avisar('Chave removida.')
      setTrocando(true)
      await recarregarEstado()
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Heading level={4} as="h2">Chave da API do Zernio</Heading>
          {chave.configurada ? <Badge tone="success">Cadastrada</Badge> : <Badge tone="warning">Pendente</Badge>}
        </div>
        <Text size="sm" tone="mute" className="mt-1">
          É por ela que o agendador publica e lê as métricas. Gere em zernio.com, no painel, em API Keys. A chave fica guardada no servidor e nunca volta para o navegador.
        </Text>

        {chave.origem === 'secret' ? (
          <Faixa tom="info" className="mt-4">
            A chave está cadastrada como secret do servidor (ZERNIO_API_KEY), final <strong>{chave.final}</strong>. Para trocar, atualize o secret no Cloudflare.
          </Faixa>
        ) : !podeSalvar ? (
          <Faixa tom="alerta" className="mt-4">
            Este ambiente não tem onde guardar a chave pela tela. Cadastre o secret ZERNIO_API_KEY no Worker (ou ligue o KV AGENDADOR_KV no wrangler.jsonc).
          </Faixa>
        ) : trocando ? (
          <form onSubmit={salvarChave} className="mt-4 flex flex-col gap-3">
            <Field label="Cole a chave">
              <Input type="password" autoComplete="off" spellCheck={false} required value={novaChave} onChange={(e) => setNovaChave(e.target.value)} placeholder="sk_…" />
            </Field>
            {erroChave && <Faixa tom="erro">{erroChave}</Faixa>}
            <div className="flex gap-2">
              <Button type="submit" size="field" disabled={salvando || !novaChave.trim()}>{salvando ? 'Conferindo…' : 'Salvar chave'}</Button>
              {chave.configurada && <Button variant="ghost" size="field" onClick={() => { setTrocando(false); setErroChave(null) }}>Cancelar</Button>}
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-ink">••••••••{chave.final}</span>
            <Button variant="secondary" size="sm" onClick={() => setTrocando(true)}>Trocar</Button>
            <Button variant="ghost" size="sm" onClick={() => setRemovendo(true)}>Remover</Button>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Heading level={4} as="h2">Content-hub</Heading>
          {hub.configurada ? <Badge tone="success">Ligado</Badge> : <Badge tone="neutral">Opcional</Badge>}
        </div>
        <Text size="sm" tone="mute" className="mt-1">
          Liga o agendador ao Conteúdo Extremo: o formulário de novo post passa a puxar os vídeos curtos aprovados (arquivo e legenda), e o status "Agendado" e "Publicado" volta para lá sozinho. Use a chave da API de integração do content-hub.
        </Text>

        {hub.origem === 'secret' ? (
          <Faixa tom="info" className="mt-4">A chave está cadastrada como secret do servidor (CONTENT_HUB_KEY), final <strong>{hub.final}</strong>.</Faixa>
        ) : hub.configurada ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-ink">••••••••{hub.final}</span>
            <Button variant="ghost" size="sm" onClick={removerHub}>Remover</Button>
          </div>
        ) : !podeSalvar ? (
          <Faixa tom="alerta" className="mt-4">Este ambiente não guarda chaves pela tela. Cadastre o secret CONTENT_HUB_KEY no Worker.</Faixa>
        ) : (
          <form onSubmit={salvarHub} className="mt-4 flex flex-col gap-3">
            <Field label="Cole a chave de integração">
              <Input type="password" autoComplete="off" spellCheck={false} required value={chaveHub} onChange={(e) => setChaveHub(e.target.value)} />
            </Field>
            {erroHub && <Faixa tom="erro">{erroHub}</Faixa>}
            <div>
              <Button type="submit" size="field" disabled={salvandoHub || !chaveHub.trim()}>{salvandoHub ? 'Conferindo…' : 'Salvar chave'}</Button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <Heading level={4} as="h2">Fuso horário</Heading>
        <Text size="sm" tone="mute" className="mt-1">
          O horário que você digita ao agendar e o que aparece no calendário valem neste fuso, não no do computador.
        </Text>
        <div className="mt-4 max-w-md">
          <Select aria-label="Fuso horário" value={estado.fuso} disabled={!podeSalvar} onChange={(e) => aplicar({ fuso: e.target.value }, 'Fuso horário atualizado.')}>
            {!FUSOS.some(([v]) => v === estado.fuso) && <option value={estado.fuso}>{estado.fuso}</option>}
            {FUSOS.map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
          </Select>
        </div>
      </Card>

      <Confirmar aberto={removendo} aoFechar={() => setRemovendo(false)} aoConfirmar={removerChave} titulo="Remover a chave do Zernio?" acao="Remover">
        O agendador para de publicar e de mostrar métricas até uma nova chave ser cadastrada. Os posts já agendados continuam no Zernio.
      </Confirmar>
    </div>
  )
}
