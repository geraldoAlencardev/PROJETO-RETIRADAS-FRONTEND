import {
  AlertTriangle,
  Asterisk,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Clock3,
  Phone,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/cliente';
import { STATUS_OS } from '../api/tipos';
import { useDados } from '../api/useDados';
import { useSincronizacao } from '../components/Sincronizacao';
import { Cartao, Carregando, ErroCarga, Painel, SeloStatus } from '../components/ui';
import { comCor, fmtDataHora, fmtNumero, haQuanto, nomeCliente } from '../lib/formato';
import { STATUS_INFO } from '../lib/status';

export function Dashboard() {
  const { rodada } = useSincronizacao();
  const resumo = useDados(() => api.resumo(), [rodada]);
  const atencao = useDados(
    () => api.listarOs({ status: ['ATRASADA', 'EM_EXTRAVIO'], tamanho: 6 }),
    [rodada],
  );
  const ultimaSinc = useDados(() => api.ultimaSincronizacao().catch(() => null), [rodada]);

  if (resumo.erro) return <ErroCarga erro={resumo.erro} tentar={resumo.recarregar} />;
  if (!resumo.dados) return <Carregando />;

  const { porStatus, total, reagendamentos } = resumo.dados;
  const maior = Math.max(1, ...STATUS_OS.map((s) => porStatus[s]));
  const maiorReag = Math.max(1, reagendamentos.cliente, reagendamentos.empresa);
  const sinc = ultimaSinc.dados;

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Visão geral</h1>
          <p>Situação operacional das retiradas de equipamento.</p>
        </div>
        <span className="espaco" />
        <span className="rotulo linha-flex" style={{ color: 'var(--texto)' }}>
          <span style={{ width: 10, height: 10, background: sinc ? 'var(--verde)' : 'var(--texto-3)' }} />
          {sinc
            ? `IXC sincronizado ${haQuanto(sinc.finalizadaEm ?? sinc.iniciadaEm)}`
            : 'IXC nunca sincronizado'}
        </span>
      </div>

      <div className="grade grade-4">
        <Cartao
          rotulo="Retiradas pendentes"
          valor={porStatus.PENDENTE}
          cor="var(--ambar)"
          icone={<Clock3 size={22} />}
          para="/retiradas?status=PENDENTE"
        />
        <Cartao
          rotulo="Em contato"
          valor={porStatus.EM_CONTATO}
          cor="var(--azul)"
          icone={<Phone size={22} />}
          para="/retiradas?status=EM_CONTATO"
        />
        <Cartao
          rotulo="Agendadas"
          valor={porStatus.AGENDADA}
          cor="var(--ciano)"
          icone={<Truck size={22} />}
          para="/agenda"
        />
        <Cartao
          rotulo="Retiradas realizadas"
          valor={porStatus.RETIRADA_OK}
          cor="var(--verde)"
          icone={<CheckCircle2 size={22} />}
          para="/retiradas?status=RETIRADA_OK"
        />
      </div>

      <div className="grade grade-3">
        <Cartao
          compacto
          rotulo="Reagendamentos cliente"
          valor={reagendamentos.cliente}
          icone={<CalendarClock size={24} />}
        />
        <Cartao
          compacto
          rotulo="Reagendamentos empresa"
          valor={reagendamentos.empresa}
          icone={<CalendarX2 size={24} />}
        />
        <Cartao
          compacto
          alerta
          rotulo="Retiradas atrasadas"
          valor={porStatus.ATRASADA}
          icone={<AlertTriangle size={24} color="var(--vermelho)" />}
          para="/retiradas?status=ATRASADA"
        />
      </div>

      <div className="grade" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
        <div className="grade">
          <Painel titulo="Solicitações por status" extra={<span className="rotulo">Total {fmtNumero(total)}</span>}>
            <div className="barras">
              {STATUS_OS.map((s) => (
                <Link key={s} to={`/retiradas?status=${s}`} className="barra" style={comCor(STATUS_INFO[s].cor)}>
                  <span className="sutil">{STATUS_INFO[s].rotulo}</span>
                  <span className="barra-trilho">
                    <span
                      className="barra-valor"
                      style={{ display: 'block', width: `${(porStatus[s] / maior) * 100}%` }}
                    />
                  </span>
                  <span style={{ textAlign: 'right' }}>{fmtNumero(porStatus[s])}</span>
                </Link>
              ))}
            </div>
          </Painel>

          <Painel titulo="Reag. cliente vs empresa">
            <div className="barras">
              {(
                [
                  ['Cliente', reagendamentos.cliente, 'var(--azul)'],
                  ['Empresa', reagendamentos.empresa, 'var(--ambar)'],
                ] as const
              ).map(([rotulo, valor, cor]) => (
                <div key={rotulo} className="barra" style={comCor(cor)}>
                  <span className="sutil">{rotulo}</span>
                  <span className="barra-trilho">
                    <span className="barra-valor" style={{ display: 'block', width: `${(valor / maiorReag) * 100}%` }} />
                  </span>
                  <span style={{ textAlign: 'right' }}>{fmtNumero(valor)}</span>
                </div>
              ))}
            </div>
          </Painel>
        </div>

        <Painel
          titulo={<span className="vermelho">Atenção necessária</span>}
          icone={<Asterisk size={18} color="var(--vermelho)" />}
          extra={
            atencao.dados && (
              <span className="selo" style={{ color: 'var(--vermelho)' }}>
                {atencao.dados.total} abertas
              </span>
            )
          }
        >
          {!atencao.dados ? (
            <Carregando />
          ) : atencao.dados.itens.length === 0 ? (
            <div className="vazio">Nenhuma OS atrasada ou em extravio.</div>
          ) : (
            <div className="grade" style={{ gap: 8 }}>
              {atencao.dados.itens.map((os) => {
                const cor = STATUS_INFO[os.status].cor;
                return (
                  <Link
                    key={os.id}
                    to={`/retiradas/${os.id}`}
                    className="painel-corpo"
                    style={{ border: `1px solid ${cor}`, display: 'block' }}
                  >
                    <div className="linha-flex">
                      <SeloStatus status={os.status} />
                      <span className="espaco" />
                      <span className="fraco" style={{ fontSize: 12 }}>
                        {haQuanto(os.dataEntradaStatus)}
                      </span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      OS {os.osExternaId} · {nomeCliente(os)}
                    </div>
                    <div className="fraco" style={{ fontSize: 12 }}>
                      {os.status === 'EM_EXTRAVIO'
                        ? `${os.qtdFalhasCiclo} tentativas sem sucesso no ciclo`
                        : `Última interação: ${fmtDataHora(os.dataUltimaInteracao)}`}
                    </div>
                  </Link>
                );
              })}
              {atencao.dados.total > atencao.dados.itens.length && (
                <Link to="/pendencias" className="link" style={{ fontSize: 13 }}>
                  Ver todas as pendências →
                </Link>
              )}
            </div>
          )}
        </Painel>
      </div>
    </>
  );
}
