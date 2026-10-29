// Janelas (modais) das ações sobre uma OS. Cada uma chama a API e, ao concluir, avisa o pai.
import { useState, type ReactNode } from 'react';
import { api } from '../../api/cliente';
import { CANAIS, type AcaoOs, type Canal, type OsDetalhe, type TipoMotivo, type Transicao } from '../../api/tipos';
import { useAvisos } from '../../components/Avisos';
import { Modal } from '../../components/ui';
import { fmtData, hojeIso } from '../../lib/formato';
import { STATUS_INFO } from '../../lib/status';

interface PropsAcao {
  os: OsDetalhe;
  aoFechar: () => void;
  aoConcluir: () => void;
}

const NOME_CANAL: Record<Canal, string> = {
  TELEFONE: 'Telefone',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  OUTRO: 'Outro',
};

function descreverTransicao(t: Transicao): string {
  if (t.de === t.para) return `Status mantido: ${STATUS_INFO[t.para].rotulo}.`;
  return `Status: ${STATUS_INFO[t.de].rotulo} → ${STATUS_INFO[t.para].rotulo}${t.codigo ? ` (${t.codigo})` : ''}.`;
}

/** Envio comum: trava o botão, mostra o erro da API dentro da janela e avisa no sucesso. */
function useEnvio(props: PropsAcao, mensagem: string) {
  const avisar = useAvisos();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();

  const enviar = async (chamada: () => Promise<{ transicao: Transicao }>) => {
    setEnviando(true);
    setErro(undefined);
    try {
      const r = await chamada();
      avisar(`${mensagem} ${descreverTransicao(r.transicao)}`, 'sucesso');
      props.aoConcluir();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };
  return { enviando, erro, enviar };
}

function Acoes(props: { aoFechar: () => void; enviando: boolean; rotulo: string; formId: string; perigo?: boolean }) {
  return (
    <>
      <button type="button" className="botao" onClick={props.aoFechar}>
        Cancelar
      </button>
      <button
        type="submit"
        form={props.formId}
        className={`botao ${props.perigo ? 'perigo' : 'primario'}`}
        disabled={props.enviando}
      >
        {props.enviando ? 'Enviando…' : props.rotulo}
      </button>
    </>
  );
}

function Erro({ erro }: { erro?: string }): ReactNode {
  return erro ? <div className="erro-form">{erro}</div> : null;
}

export function ModalContato(props: PropsAcao) {
  const { enviando, erro, enviar } = useEnvio(props, 'Tentativa registrada.');
  const [canal, setCanal] = useState<Canal>('TELEFONE');
  const [sucesso, setSucesso] = useState(false);
  const [observacao, setObservacao] = useState('');

  return (
    <Modal
      titulo="Registrar tentativa de contato"
      aoFechar={props.aoFechar}
      acoes={<Acoes aoFechar={props.aoFechar} enviando={enviando} rotulo="Registrar" formId="form-contato" />}
    >
      <form
        id="form-contato"
        className="grade"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(() =>
            api.registrarTentativa(props.os.id, {
              canal,
              sucesso,
              observacao: observacao.trim() || undefined,
            }),
          );
        }}
      >
        <div className="campo">
          <span>CANAL</span>
          <div className="opcoes">
            {CANAIS.map((c) => (
              <button
                type="button"
                key={c}
                className={c === canal ? 'escolhida' : undefined}
                onClick={() => setCanal(c)}
              >
                {NOME_CANAL[c]}
              </button>
            ))}
          </div>
        </div>
        <label className="marcar">
          <input type="checkbox" checked={sucesso} onChange={(e) => setSucesso(e.target.checked)} />
          Contato realizado com sucesso
        </label>
        {!sucesso && (
          <div className="sutil" style={{ fontSize: 12 }}>
            Falhas no ciclo atual: {props.os.qtdFalhasCiclo} de 3. Na 3ª falha a OS vai para Em
            extravio.
          </div>
        )}
        <label className="campo">
          <span>OBSERVAÇÃO</span>
          <textarea
            className="entrada"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            maxLength={1000}
            placeholder="Ex.: cliente não atendeu, deixado recado…"
          />
        </label>
        <Erro erro={erro} />
      </form>
    </Modal>
  );
}

/** Agendar (primeiro agendamento) ou reagendar (OS já agendada: exige quem motivou). */
export function ModalAgendar(props: PropsAcao) {
  const reagendamento = props.os.status === 'AGENDADA';
  const { enviando, erro, enviar } = useEnvio(props, reagendamento ? 'Retirada reagendada.' : 'Retirada agendada.');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [tipoMotivo, setTipoMotivo] = useState<TipoMotivo>();
  const [detalhe, setDetalhe] = useState('');
  const [erroLocal, setErroLocal] = useState<string>();

  return (
    <Modal
      titulo={reagendamento ? 'Reagendar retirada' : 'Agendar retirada'}
      aoFechar={props.aoFechar}
      acoes={
        <Acoes
          aoFechar={props.aoFechar}
          enviando={enviando}
          rotulo={reagendamento ? 'Reagendar' : 'Agendar'}
          formId="form-agendar"
        />
      }
    >
      <form
        id="form-agendar"
        className="grade"
        onSubmit={(e) => {
          e.preventDefault();
          if (reagendamento && !tipoMotivo) {
            setErroLocal('Informe quem motivou o reagendamento.');
            return;
          }
          setErroLocal(undefined);
          void enviar(() =>
            api.agendar(props.os.id, {
              dataPrevista: data,
              horario: horario || undefined,
              tipoMotivo: reagendamento ? tipoMotivo : undefined,
              motivoDetalhe: detalhe.trim() || undefined,
            }),
          );
        }}
      >
        {reagendamento && props.os.agendamentoVigente && (
          <div className="sutil">
            Data atual: {fmtData(props.os.agendamentoVigente.dataPrevista)}
            {props.os.agendamentoVigente.horario ? ` às ${props.os.agendamentoVigente.horario}` : ''}
          </div>
        )}
        <div className="grade grade-2">
          <label className="campo">
            <span>DATA PREVISTA</span>
            <input
              className="entrada"
              type="date"
              min={hojeIso()}
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </label>
          <label className="campo">
            <span>HORÁRIO (OPCIONAL)</span>
            <input className="entrada" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
          </label>
        </div>
        {reagendamento && (
          <div className="campo">
            <span>QUEM MOTIVOU</span>
            <div className="opcoes">
              {(['CLIENTE', 'EMPRESA'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  className={t === tipoMotivo ? 'escolhida' : undefined}
                  onClick={() => setTipoMotivo(t)}
                >
                  {t === 'CLIENTE' ? 'Cliente' : 'Empresa'}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="campo">
          <span>{reagendamento ? 'MOTIVO' : 'OBSERVAÇÃO'} (OPCIONAL)</span>
          <input className="entrada" value={detalhe} onChange={(e) => setDetalhe(e.target.value)} maxLength={300} />
        </label>
        <Erro erro={erroLocal ?? erro} />
      </form>
    </Modal>
  );
}

export function ModalReverter(props: PropsAcao) {
  const { enviando, erro, enviar } = useEnvio(props, 'Agendamento revertido.');
  const [motivo, setMotivo] = useState('');

  return (
    <Modal
      titulo="Reverter agendamento"
      aoFechar={props.aoFechar}
      acoes={<Acoes aoFechar={props.aoFechar} enviando={enviando} rotulo="Reverter" formId="form-reverter" perigo />}
    >
      <form
        id="form-reverter"
        className="grade"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(() => api.reverterAgendamento(props.os.id, motivo.trim()));
        }}
      >
        <div className="sutil">
          O agendamento vigente deixa de valer (continua no histórico) e a OS volta para Em contato.
        </div>
        <label className="campo">
          <span>MOTIVO</span>
          <textarea
            className="entrada"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={500}
            required
          />
        </label>
        <Erro erro={erro} />
      </form>
    </Modal>
  );
}

export const ACOES_SIMPLES: Record<AcaoOs, { rotulo: string; titulo: string; texto: string; perigo?: boolean }> = {
  CONCLUIR_RETIRADA: {
    rotulo: 'Concluir retirada',
    titulo: 'Concluir retirada',
    texto: 'Confirma que o equipamento foi retirado? A OS vai para Retirada OK (status final).',
  },
  GERAR_MULTA: {
    rotulo: 'Gerar multa',
    titulo: 'Gerar multa',
    texto: 'A OS vai para Multa gerada (status final).',
    perigo: true,
  },
  INICIAR_REATIVACAO: {
    rotulo: 'Iniciar reativação',
    titulo: 'Iniciar reativação',
    texto: 'A OS vai para Em reativação. Se não for concluída em 5 dias úteis, volta para Pendente.',
  },
  CONCLUIR_REATIVACAO: {
    rotulo: 'Concluir reativação',
    titulo: 'Concluir reativação',
    texto: 'A OS vai para Reativação concluída (status final).',
  },
};

export function ModalAcaoSimples(props: PropsAcao & { acao: AcaoOs }) {
  const info = ACOES_SIMPLES[props.acao];
  const { enviando, erro, enviar } = useEnvio(props, `${info.rotulo}: feito.`);
  const [motivo, setMotivo] = useState('');

  return (
    <Modal
      titulo={info.titulo}
      aoFechar={props.aoFechar}
      acoes={
        <Acoes aoFechar={props.aoFechar} enviando={enviando} rotulo="Confirmar" formId="form-acao" perigo={info.perigo} />
      }
    >
      <form
        id="form-acao"
        className="grade"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(() => api.acao(props.os.id, props.acao, motivo.trim() || undefined));
        }}
      >
        <div className="sutil">{info.texto}</div>
        <label className="campo">
          <span>MOTIVO / OBSERVAÇÃO (OPCIONAL)</span>
          <input className="entrada" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
        </label>
        <Erro erro={erro} />
      </form>
    </Modal>
  );
}
