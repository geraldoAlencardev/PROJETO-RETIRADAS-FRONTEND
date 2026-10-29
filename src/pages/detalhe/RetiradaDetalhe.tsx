import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChevronRight,
  ContactRound,
  Cpu,
  History,
  Hourglass,
  MapPin,
  PhoneCall,
  PhoneOff,
  Truck,
  Undo2,
  User,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/cliente';
import type { AcaoOs, OsDetalhe, StatusOs } from '../../api/tipos';
import { useDados } from '../../api/useDados';
import { useSincronizacao } from '../../components/Sincronizacao';
import { Cartao, Carregando, ErroCarga, Painel, SeloIxc, SeloStatus } from '../../components/ui';
import {
  comCor,
  doisDigitos,
  fmtData,
  fmtDataHora,
  horasDesde,
  nomeCliente,
  tempoDesde,
} from '../../lib/formato';
import { STATUS_FINAIS, STATUS_INFO, STATUS_IXC, TIPO_EVENTO } from '../../lib/status';
import { ACOES_SIMPLES, ModalAcaoSimples, ModalAgendar, ModalContato, ModalReverter } from './Acoes';

type Janela = 'CONTATO' | 'AGENDAR' | 'REVERTER' | AcaoOs | null;

/** Ações disponíveis em cada status (espelha a máquina de estados da API). */
function acoesDoStatus(status: StatusOs): Janela[] {
  switch (status) {
    case 'PENDENTE':
    case 'EM_CONTATO':
    case 'ATRASADA':
      return ['AGENDAR', 'CONTATO'];
    case 'AGENDADA':
      return ['CONCLUIR_RETIRADA', 'AGENDAR', 'REVERTER'];
    case 'EM_EXTRAVIO':
      return ['INICIAR_REATIVACAO', 'GERAR_MULTA'];
    case 'EM_REATIVACAO':
      return ['CONCLUIR_REATIVACAO'];
    default:
      return [];
  }
}

function BotaoAcao({ janela, os, abrir, principal }: { janela: Janela; os: OsDetalhe; abrir: (j: Janela) => void; principal: boolean }) {
  const classe = `botao${principal ? ' primario' : ''}`;
  switch (janela) {
    case 'AGENDAR':
      return (
        <button className={classe} onClick={() => abrir('AGENDAR')}>
          {os.status === 'AGENDADA' ? <CalendarClock size={16} /> : <CalendarPlus size={16} />}
          {os.status === 'AGENDADA' ? 'Reagendar' : 'Agendar retirada'}
        </button>
      );
    case 'CONTATO':
      return (
        <button className={classe} onClick={() => abrir('CONTATO')}>
          <ContactRound size={16} /> Registrar contato
        </button>
      );
    case 'REVERTER':
      return (
        <button className={classe} onClick={() => abrir('REVERTER')}>
          <Undo2 size={16} /> Reverter agendamento
        </button>
      );
    case null:
      return null;
    default:
      return (
        <button className={`${classe}${ACOES_SIMPLES[janela].perigo ? ' perigo' : ''}`} onClick={() => abrir(janela)}>
          {janela === 'CONCLUIR_RETIRADA' ? <CalendarCheck size={16} /> : <Truck size={16} />}
          {ACOES_SIMPLES[janela].rotulo}
        </button>
      );
  }
}

function Dado({ rotulo, children, largo }: { rotulo: string; children: ReactNode; largo?: boolean }) {
  return (
    <div className="dado" style={largo ? { gridColumn: '1 / -1' } : undefined}>
      <span className="rotulo">{rotulo}</span>
      {children}
    </div>
  );
}

export function RetiradaDetalhe() {
  const { id = '' } = useParams();
  const { rodada } = useSincronizacao();
  const [versao, setVersao] = useState(0);
  const [janela, setJanela] = useState<Janela>(null);

  const os = useDados(() => api.os(id), [id, versao, rodada]);
  const historico = useDados(() => api.historico(id), [id, versao, rodada]);
  const tentativas = useDados(() => api.tentativas(id), [id, versao]);
  const agendamentos = useDados(() => api.agendamentos(id), [id, versao]);

  if (os.erro) return <ErroCarga erro={os.erro} tentar={os.recarregar} />;
  if (!os.dados) return <Carregando />;
  const o = os.dados;

  const acoes = acoesDoStatus(o.status);
  const diasNoStatus = Math.floor(horasDesde(o.dataEntradaStatus) / 24);
  const final = STATUS_FINAIS.includes(o.status);
  const concluir = () => {
    setJanela(null);
    setVersao((v) => v + 1);
  };
  const props = { os: o, aoFechar: () => setJanela(null), aoConcluir: concluir };

  return (
    <>
      <div>
        <div className="trilha">
          <Link to="/retiradas">Retiradas</Link>
          <ChevronRight size={14} /> Detalhes
        </div>
        <div className="linha-flex" style={{ alignItems: 'flex-end' }}>
          <h1>RETIRADA #{o.osExternaId}</h1>
          <span className="espaco" />
          <SeloStatus status={o.status} />
        </div>
      </div>

      <div className="grade grade-4">
        <Cartao
          rotulo="Tentativas de contato"
          valor={doisDigitos(o.qtdTentativasContato)}
          icone={<PhoneCall size={18} />}
          rodape={
            <span className="fraco" style={{ fontSize: 12 }}>
              {o.qtdTentativasSemSucesso} sem sucesso · {o.qtdFalhasCiclo}/3 no ciclo
            </span>
          }
        />
        <Cartao rotulo="Reagendamentos cliente" valor={doisDigitos(o.reagendamentosCliente)} icone={<CalendarClock size={18} />} />
        <Cartao rotulo="Reagendamentos empresa" valor={doisDigitos(o.reagendamentosEmpresa)} icone={<CalendarClock size={18} />} />
        <Cartao
          rotulo="Dias no status atual"
          valor={doisDigitos(diasNoStatus)}
          alerta={o.status === 'ATRASADA' || o.status === 'EM_EXTRAVIO'}
          icone={<Hourglass size={18} />}
          rodape={
            <span className="fraco" style={{ fontSize: 12 }}>
              desde {fmtDataHora(o.dataEntradaStatus)}
            </span>
          }
        />
      </div>

      <div className="painel painel-corpo linha-flex" style={{ flexWrap: 'wrap' }}>
        {acoes.length === 0 ? (
          <span className="sutil">
            {final ? 'OS em status final: nenhuma ação disponível.' : 'Nenhuma ação manual neste status.'}
          </span>
        ) : (
          acoes.map((j, i) => <BotaoAcao key={String(j)} janela={j} os={o} abrir={setJanela} principal={i === 0} />)
        )}
      </div>

      <div className="grade" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', alignItems: 'start' }}>
        <div className="grade">
          <Painel titulo="Informações do cliente" icone={<User size={18} />}>
            <div className="grade grade-2" style={{ gap: 10 }}>
              <Dado rotulo="Cliente">{nomeCliente(o)}</Dado>
              <Dado rotulo="Contrato">{o.contratoId}</Dado>
              <Dado rotulo="Endereço de retirada" largo>
                <div className="linha-flex" style={{ alignItems: 'flex-start' }}>
                  <MapPin size={16} className="sutil" style={{ marginTop: 2 }} />
                  <div>
                    <div>{o.endereco || '--'}</div>
                    <div className="sutil">{o.bairro ?? ''}</div>
                    {o.referencia && <div className="fraco">Ref.: {o.referencia}</div>}
                  </div>
                </div>
              </Dado>
            </div>
          </Painel>

          <div className="grade grade-2">
            <Painel titulo="Origem (IXC)" icone={<History size={18} />}>
              <div className="grade" style={{ gap: 12 }}>
                <div>
                  <div className="rotulo">Nº do chamado</div>
                  {o.osExternaId}
                </div>
                <div>
                  <div className="rotulo">Protocolo</div>
                  {o.protocoloExterno ?? '--'}
                </div>
                <div>
                  <div className="rotulo">Abertura</div>
                  {fmtData(o.dataAbertura)}
                </div>
                <div>
                  <div className="rotulo">Status no IXC</div>
                  <span className="linha-flex">
                    <SeloIxc status={o.statusExterno} />
                    {o.statusExterno && <span className="sutil">{STATUS_IXC[o.statusExterno] ?? ''}</span>}
                  </span>
                </div>
              </div>
            </Painel>

            <Painel titulo="Status da retirada" icone={<Truck size={18} />}>
              <div className="grade" style={{ gap: 12 }}>
                <div>
                  <div className="rotulo">Data prevista</div>
                  {o.agendamentoVigente ? (
                    <span className={o.status === 'AGENDADA' ? undefined : 'riscado'}>
                      {fmtData(o.agendamentoVigente.dataPrevista)}
                      {o.agendamentoVigente.horario ? ` às ${o.agendamentoVigente.horario}` : ''}
                    </span>
                  ) : (
                    <span className={o.status === 'ATRASADA' ? 'vermelho' : 'sutil'}>
                      {o.status === 'ATRASADA' ? 'ATRASADA / NÃO AGENDADA' : 'Não agendada'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="rotulo">Última interação</div>
                  {o.dataUltimaInteracao ? (
                    <>
                      {fmtDataHora(o.dataUltimaInteracao)}{' '}
                      <span className="fraco">({tempoDesde(o.dataUltimaInteracao)})</span>
                    </>
                  ) : (
                    <span className="sutil">Nenhuma</span>
                  )}
                </div>
                <div>
                  <div className="rotulo">Status</div>
                  <span style={{ color: STATUS_INFO[o.status].cor }}>{STATUS_INFO[o.status].rotulo}</span>
                </div>
              </div>
            </Painel>
          </div>

          <Painel titulo="Tentativas de contato" icone={<PhoneCall size={18} />} semPadding>
            {tentativas.dados?.itens.length ? (
              <div className="tabela-caixa">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Canal</th>
                      <th>Resultado</th>
                      <th>Observação</th>
                      <th>Usuário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tentativas.dados.itens.map((t) => (
                      <tr key={t.id}>
                        <td>{fmtDataHora(t.dataHora)}</td>
                        <td>{t.canal}</td>
                        <td>
                          {t.sucesso ? (
                            <span className="verde linha-flex">
                              <PhoneCall size={14} /> Sucesso
                            </span>
                          ) : (
                            <span className="vermelho linha-flex">
                              <PhoneOff size={14} /> Sem sucesso
                            </span>
                          )}
                        </td>
                        <td className="truncar" title={t.observacao ?? ''}>
                          {t.observacao ?? '--'}
                        </td>
                        <td className="sutil">{t.usuarioNome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="vazio">{tentativas.dados ? 'Nenhuma tentativa registrada.' : 'Carregando…'}</div>
            )}
          </Painel>

          <Painel titulo="Histórico de agendamentos" icone={<CalendarClock size={18} />} semPadding>
            {agendamentos.dados?.itens.length ? (
              <div className="tabela-caixa">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Data prevista</th>
                      <th>Registrado em</th>
                      <th>Motivo</th>
                      <th>Detalhe</th>
                      <th>Usuário</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.dados.itens.map((a) => (
                      <tr key={a.id}>
                        <td>
                          {fmtData(a.dataPrevista)}
                          {a.horario ? ` ${a.horario}` : ''}
                        </td>
                        <td className="sutil">{fmtDataHora(a.dataHoraRegistro)}</td>
                        <td>{a.tipoMotivo ?? <span className="fraco">1º agendamento</span>}</td>
                        <td className="truncar" title={a.motivoDetalhe ?? ''}>
                          {a.motivoDetalhe ?? '--'}
                        </td>
                        <td className="sutil">{a.usuarioNome}</td>
                        <td>{a.vigente ? <span className="verde">Vigente</span> : <span className="fraco">Substituído</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="vazio">{agendamentos.dados ? 'Nenhum agendamento.' : 'Carregando…'}</div>
            )}
          </Painel>
        </div>

        <Painel titulo="Linha do tempo" icone={<History size={18} />} semPadding>
          {!historico.dados ? (
            <Carregando />
          ) : historico.dados.itens.length === 0 ? (
            <div className="vazio">Sem eventos.</div>
          ) : (
            <div className="linha-tempo">
              {[...historico.dados.itens].reverse().map((ev, i) => {
                const cor =
                  i === 0
                    ? 'var(--ambar)'
                    : ev.tipoEvento === 'CONCLUSAO'
                      ? 'var(--verde)'
                      : ev.tipoEvento === 'RECEBIMENTO'
                        ? 'var(--vermelho)'
                        : 'var(--texto-3)';
                return (
                  <div key={ev.id} className="evento" style={comCor(cor)}>
                    <span className="evento-marca" />
                    <div className="evento-quando">{fmtDataHora(ev.dataHora)}</div>
                    <div className="evento-titulo">{TIPO_EVENTO[ev.tipoEvento] ?? ev.tipoEvento}</div>
                    <div className="evento-texto">
                      {ev.descricao}
                      {ev.motivo ? `\nMotivo: ${ev.motivo}` : ''}
                    </div>
                    <div className="evento-autor linha-flex">
                      {ev.usuarioNome ? <User size={12} /> : <Cpu size={12} />}
                      {ev.usuarioNome ?? 'Sistema'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Painel>
      </div>

      {janela === 'CONTATO' && <ModalContato {...props} />}
      {janela === 'AGENDAR' && <ModalAgendar {...props} />}
      {janela === 'REVERTER' && <ModalReverter {...props} />}
      {janela && janela in ACOES_SIMPLES && <ModalAcaoSimples {...props} acao={janela as AcaoOs} />}
    </>
  );
}
