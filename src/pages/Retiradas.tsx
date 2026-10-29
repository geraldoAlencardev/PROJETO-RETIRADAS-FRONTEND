import { Eye } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/cliente';
import { STATUS_OS, type StatusOs } from '../api/tipos';
import { useDados } from '../api/useDados';
import { useSincronizacao } from '../components/Sincronizacao';
import { ErroCarga, Paginacao, SeloIxc, SeloStatus } from '../components/ui';
import { fmtData, fmtDataHora, nomeCliente } from '../lib/formato';
import { STATUS_INFO } from '../lib/status';

const TAMANHO = 20;

export function Retiradas() {
  const { rodada } = useSincronizacao();
  const [params, setParams] = useSearchParams();
  const busca = params.get('busca') ?? '';
  const statusParam = params.get('status') ?? '';
  const status = STATUS_OS.includes(statusParam as StatusOs) ? (statusParam as StatusOs) : '';
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);

  // Campos do formulário; só valem ao clicar em "Aplicar filtros".
  const [buscaForm, setBuscaForm] = useState(busca);
  const [statusForm, setStatusForm] = useState<string>(status);
  useEffect(() => {
    setBuscaForm(busca);
    setStatusForm(status);
  }, [busca, status]);

  const lista = useDados(
    () =>
      api.listarOs({
        busca: busca || undefined,
        status: status ? [status] : undefined,
        pagina,
        tamanho: TAMANHO,
      }),
    [busca, status, pagina, rodada],
  );

  const aplicar = (e?: FormEvent) => {
    e?.preventDefault();
    const novos = new URLSearchParams();
    if (buscaForm.trim()) novos.set('busca', buscaForm.trim());
    if (statusForm) novos.set('status', statusForm);
    setParams(novos);
  };

  const mudarPagina = (p: number) => {
    const novos = new URLSearchParams(params);
    novos.set('pagina', String(p));
    setParams(novos);
  };

  return (
    <>
      <form className="painel painel-corpo" onSubmit={aplicar}>
        <div className="filtros">
          <label className="campo" style={{ gridColumn: 'span 2' }}>
            <span>Busca</span>
            <input
              className="entrada"
              value={buscaForm}
              onChange={(e) => setBuscaForm(e.target.value)}
              placeholder="Nº da OS, protocolo, contrato, cliente ou bairro"
            />
          </label>
          <label className="campo">
            <span>Status</span>
            <select className="entrada" value={statusForm} onChange={(e) => setStatusForm(e.target.value)}>
              <option value="">Todos</option>
              {STATUS_OS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_INFO[s].rotulo}
                </option>
              ))}
            </select>
          </label>
          <div className="linha-flex" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="botao"
              onClick={() => {
                setBuscaForm('');
                setStatusForm('');
                setParams(new URLSearchParams());
              }}
            >
              Limpar
            </button>
            <button className="botao primario">Aplicar filtros</button>
          </div>
        </div>
      </form>

      {lista.erro ? (
        <ErroCarga erro={lista.erro} tentar={lista.recarregar} />
      ) : (
        <div className="painel">
          <div className="tabela-caixa">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº OS</th>
                  <th>Protocolo</th>
                  <th>Cliente</th>
                  <th>Bairro</th>
                  <th>Prev. retirada</th>
                  <th className="num">Contatos</th>
                  <th className="num">Reag. cli.</th>
                  <th className="num">Reag. emp.</th>
                  <th>Status</th>
                  <th>IXC</th>
                  <th>Última atualização</th>
                  <th aria-label="Abrir" />
                </tr>
              </thead>
              <tbody style={{ opacity: lista.carregando ? 0.5 : 1 }}>
                {lista.dados?.itens.map((os) => (
                  <tr key={os.id}>
                    <td>
                      <Link to={`/retiradas/${os.id}`} className="link">
                        {os.osExternaId}
                      </Link>
                    </td>
                    <td className="sutil">{os.protocoloExterno ?? '--'}</td>
                    <td className="truncar" title={nomeCliente(os)}>
                      {nomeCliente(os)}
                    </td>
                    <td className="truncar sutil">{os.bairro ?? '--'}</td>
                    <td>
                      {os.dataPrevista ? (
                        <span className={os.status === 'AGENDADA' ? undefined : 'riscado'}>
                          {fmtData(os.dataPrevista)}
                          {os.horarioPrevisto ? ` ${os.horarioPrevisto}` : ''}
                        </span>
                      ) : (
                        <span className="fraco">--</span>
                      )}
                    </td>
                    <td className="num">{os.qtdTentativasContato}</td>
                    <td className="num">{os.reagendamentosCliente}</td>
                    <td className="num">{os.reagendamentosEmpresa}</td>
                    <td>
                      <SeloStatus status={os.status} />
                    </td>
                    <td>
                      <SeloIxc status={os.statusExterno} />
                    </td>
                    <td className="sutil" style={{ fontSize: 12 }}>
                      {fmtDataHora(os.atualizadoEm)}
                    </td>
                    <td>
                      <Link to={`/retiradas/${os.id}`} className="icone-botao" aria-label="Ver detalhes">
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lista.dados?.itens.length === 0 && <div className="vazio">Nenhuma OS encontrada.</div>}
          </div>
          {lista.dados && (
            <Paginacao
              pagina={lista.dados.pagina}
              totalPaginas={lista.dados.totalPaginas}
              total={lista.dados.total}
              tamanho={lista.dados.tamanho}
              quantidade={lista.dados.itens.length}
              aoMudar={mudarPagina}
            />
          )}
        </div>
      )}
    </>
  );
}
