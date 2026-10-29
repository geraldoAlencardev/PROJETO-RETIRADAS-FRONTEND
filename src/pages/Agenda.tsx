import { CalendarDays, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/cliente';
import type { Os } from '../api/tipos';
import { useDados } from '../api/useDados';
import { useSincronizacao } from '../components/Sincronizacao';
import { Carregando, ErroCarga, Painel } from '../components/ui';
import { fmtData, hojeIso, nomeCliente } from '../lib/formato';

const DIA_SEMANA = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' });

/** Retiradas agendadas, agrupadas por dia. */
export function Agenda() {
  const { rodada } = useSincronizacao();
  const lista = useDados(() => api.listarOs({ status: ['AGENDADA'], tamanho: 100 }), [rodada]);

  if (lista.erro) return <ErroCarga erro={lista.erro} tentar={lista.recarregar} />;
  if (!lista.dados) return <Carregando />;

  const hoje = hojeIso();
  const porDia = new Map<string, Os[]>();
  for (const os of lista.dados.itens) {
    const dia = os.dataPrevista ?? 'sem-data';
    porDia.set(dia, [...(porDia.get(dia) ?? []), os]);
  }
  const dias = [...porDia.keys()].sort();

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Agenda de retiradas</h1>
          <p>{lista.dados.total} retiradas agendadas.</p>
        </div>
      </div>

      {dias.length === 0 && <div className="painel vazio">Nenhuma retirada agendada.</div>}

      {dias.map((dia) => {
        const atrasado = dia !== 'sem-data' && dia < hoje;
        const titulo =
          dia === 'sem-data'
            ? 'Sem data'
            : `${fmtData(dia)} · ${DIA_SEMANA.format(new Date(`${dia}T00:00:00Z`))}${dia === hoje ? ' · hoje' : ''}`;
        const itens = (porDia.get(dia) ?? []).sort((a, b) =>
          (a.horarioPrevisto ?? '99').localeCompare(b.horarioPrevisto ?? '99'),
        );
        return (
          <Painel
            key={dia}
            titulo={<span className={atrasado ? 'vermelho' : undefined}>{titulo}</span>}
            icone={<CalendarDays size={18} color={atrasado ? 'var(--vermelho)' : undefined} />}
            extra={<span className="rotulo">{itens.length}</span>}
            semPadding
          >
            <table className="tabela">
              <tbody>
                {itens.map((os) => (
                  <tr key={os.id}>
                    <td style={{ width: 110 }}>
                      <span className="linha-flex">
                        <Clock size={14} className="sutil" />
                        {os.horarioPrevisto ?? '--:--'}
                      </span>
                    </td>
                    <td style={{ width: 140 }}>
                      <Link to={`/retiradas/${os.id}`} className="link">
                        #{os.osExternaId}
                      </Link>
                    </td>
                    <td className="truncar">{nomeCliente(os)}</td>
                    <td className="truncar sutil">{[os.endereco, os.bairro].filter(Boolean).join(' · ')}</td>
                    <td className="num sutil" style={{ width: 160 }}>
                      {os.reagendamentosCliente + os.reagendamentosEmpresa} reagendamento(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Painel>
        );
      })}
    </>
  );
}
