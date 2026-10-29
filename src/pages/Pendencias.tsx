import { AlertTriangle, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/cliente';
import type { Os } from '../api/tipos';
import { useDados } from '../api/useDados';
import { BotaoSincronizar, useSincronizacao } from '../components/Sincronizacao';
import { Carregando, ErroCarga, Painel } from '../components/ui';
import { doisDigitos, haQuanto, horasDesde, nomeCliente, tempoDesde } from '../lib/formato';

// Tamanho máximo da página na API; as filas de pendência costumam ser menores que isso.
const LIMITE = 100;

function Quadradinho({ cor }: { cor: string }) {
  return <span style={{ width: 10, height: 10, background: cor, display: 'inline-block' }} />;
}

function Contador({ valor, cor }: { valor: number; cor: string }) {
  return (
    <span style={{ color: cor, fontFamily: 'var(--titulo)', fontSize: 22, fontWeight: 600 }}>
      {doisDigitos(valor)}
    </span>
  );
}

export function Pendencias() {
  const { rodada } = useSincronizacao();
  const pendentes = useDados(() => api.listarOs({ status: ['PENDENTE'], tamanho: LIMITE }), [rodada]);
  const emContato = useDados(
    () => api.listarOs({ status: ['EM_CONTATO', 'ATRASADA'], tamanho: LIMITE }),
    [rodada],
  );
  const extravio = useDados(() => api.listarOs({ status: ['EM_EXTRAVIO'], tamanho: LIMITE }), [rodada]);

  const erro = pendentes.erro ?? emContato.erro ?? extravio.erro;
  if (erro) {
    return (
      <ErroCarga
        erro={erro}
        tentar={() => {
          void pendentes.recarregar();
          void emContato.recarregar();
          void extravio.recarregar();
        }}
      />
    );
  }

  // Mais antigas primeiro: quem espera há mais tempo aparece no topo.
  const porEspera = (a: Os, b: Os) => a.dataEntradaStatus.localeCompare(b.dataEntradaStatus);
  const aguardando = [...(pendentes.dados?.itens ?? [])].sort(porEspera);
  const semSucesso = (emContato.dados?.itens ?? [])
    .filter((o) => o.qtdFalhasCiclo > 0)
    .sort((a, b) => b.qtdFalhasCiclo - a.qtdFalhasCiclo);
  const emExtravio = [...(extravio.dados?.itens ?? [])].sort(porEspera);
  const totalAlertas = (pendentes.dados?.total ?? 0) + semSucesso.length + (extravio.dados?.total ?? 0);

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Ação requerida (Pendências)</h1>
          <p>OS que esperam o primeiro contato, que acumulam tentativas sem sucesso ou que estão em extravio.</p>
        </div>
        <span className="espaco" />
        <span className="selo linha-flex" style={{ color: 'var(--ambar)', padding: '6px 10px' }}>
          <AlertTriangle size={14} /> {totalAlertas} pendências
        </span>
        <BotaoSincronizar />
      </div>

      <div className="grade grade-2" style={{ alignItems: 'start' }}>
        <Painel
          titulo="Aguardando primeiro contato"
          icone={<Quadradinho cor="var(--vermelho)" />}
          extra={<Contador valor={pendentes.dados?.total ?? 0} cor="var(--vermelho)" />}
          semPadding
        >
          {!pendentes.dados ? (
            <Carregando />
          ) : aguardando.length === 0 ? (
            <div className="vazio">Nenhuma OS aguardando contato.</div>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>OS</th>
                  <th>Cliente</th>
                  <th>Tempo pend.</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {aguardando.map((os) => {
                  const critico = horasDesde(os.dataEntradaStatus) >= 48;
                  return (
                    <tr key={os.id} style={critico ? { background: '#1b1212' } : undefined}>
                      <td>
                        <Link to={`/retiradas/${os.id}`} className="link">
                          #{os.osExternaId}
                        </Link>
                      </td>
                      <td className="truncar">{nomeCliente(os)}</td>
                      <td className={critico ? 'vermelho' : 'ambar'}>
                        <span className="linha-flex">
                          {critico && <Timer size={14} />}
                          {tempoDesde(os.dataEntradaStatus)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/retiradas/${os.id}`} className="botao pequeno">
                          Contatar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Painel>

        <div className="grade">
          <Painel
            titulo="Tentativas sem sucesso"
            icone={<Quadradinho cor="var(--ambar)" />}
            extra={<Contador valor={semSucesso.length} cor="var(--ambar)" />}
          >
            {!emContato.dados ? (
              <Carregando />
            ) : semSucesso.length === 0 ? (
              <div className="vazio">Nenhuma OS com falhas no ciclo atual.</div>
            ) : (
              <div className="grade" style={{ gap: 8 }}>
                {semSucesso.map((os) => (
                  <Link key={os.id} to={`/retiradas/${os.id}`} className="painel-corpo painel" style={{ display: 'block' }}>
                    <div className="linha-flex">
                      <span className="link">#{os.osExternaId}</span>
                      <span className="espaco" />
                      <span className="selo" style={{ color: 'var(--ambar)' }}>
                        {os.qtdFalhasCiclo} de 3 tentativas
                      </span>
                    </div>
                    <div>{nomeCliente(os)}</div>
                    <div className="linha-flex rotulo" style={{ borderTop: '1px solid var(--linha)', marginTop: 8, paddingTop: 8 }}>
                      Última: {haQuanto(os.dataUltimaInteracao)}
                      <span className="espaco" />
                      {os.status === 'ATRASADA' && <span className="vermelho">Atrasada</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Painel>

          <Painel
            titulo="Em extravio"
            icone={<Quadradinho cor="var(--laranja)" />}
            extra={<Contador valor={extravio.dados?.total ?? 0} cor="var(--laranja)" />}
          >
            {!extravio.dados ? (
              <Carregando />
            ) : emExtravio.length === 0 ? (
              <div className="vazio">Nenhuma OS em extravio.</div>
            ) : (
              <div className="grade" style={{ gap: 8 }}>
                {emExtravio.map((os) => (
                  <Link key={os.id} to={`/retiradas/${os.id}`} className="painel-corpo painel linha-flex">
                    <span className="link">#{os.osExternaId}</span>
                    <span className="truncar">{nomeCliente(os)}</span>
                    <span className="espaco" />
                    <span className="fraco" style={{ fontSize: 12 }}>
                      há {tempoDesde(os.dataEntradaStatus)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Painel>
        </div>
      </div>
    </>
  );
}
