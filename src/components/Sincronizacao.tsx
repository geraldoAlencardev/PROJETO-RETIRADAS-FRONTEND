import { RefreshCw } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { api, ErroApi } from '../api/cliente';
import { fmtDataHora } from '../lib/formato';
import { useAvisos } from './Avisos';

interface ContextoSinc {
  sincronizando: boolean;
  sincronizar: () => Promise<void>;
  /** Incrementa quando uma sincronização termina, para as telas recarregarem. */
  rodada: number;
}

const Contexto = createContext<ContextoSinc>({
  sincronizando: false,
  sincronizar: async () => undefined,
  rodada: 0,
});

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Botão "Sincronizar agora": pede à API para ler as OS do IXC (o IXC só fornece dados;
 * nada é enviado a ele) e acompanha a execução até terminar.
 */
export function ProvedorSincronizacao({ children }: { children: ReactNode }) {
  const avisar = useAvisos();
  const [sincronizando, setSincronizando] = useState(false);
  const [rodada, setRodada] = useState(0);
  const emCurso = useRef(false);

  const sincronizar = useCallback(async () => {
    if (emCurso.current) return;
    emCurso.current = true;
    setSincronizando(true);
    try {
      const { id } = await api.sincronizar();
      avisar('Sincronização com o IXC iniciada…');
      for (;;) {
        await esperar(2000);
        const s = await api.sincronizacao(id);
        if (s.situacao === 'EM_ANDAMENTO') continue;
        if (s.situacao === 'CONCLUIDA') {
          avisar(
            `Sincronização concluída: ${s.criadas} novas, ${s.atualizadas} atualizadas, ` +
              `${s.finalizadas} finalizadas${s.comErro ? `, ${s.comErro} com erro` : ''}.`,
            s.comErro ? 'info' : 'sucesso',
          );
        } else {
          avisar(`Sincronização falhou: ${s.erro ?? 'erro desconhecido'}`, 'erro');
        }
        setRodada((r) => r + 1);
        break;
      }
    } catch (e) {
      if (e instanceof ErroApi && e.status === 429) {
        const liberadaEm = (e.corpo as { liberadaEm?: string } | undefined)?.liberadaEm;
        avisar(`${e.message}${liberadaEm ? ` Liberada em ${fmtDataHora(liberadaEm)}.` : ''}`, 'info');
      } else {
        avisar(e instanceof Error ? e.message : String(e), 'erro');
      }
    } finally {
      emCurso.current = false;
      setSincronizando(false);
    }
  }, [avisar]);

  return (
    <Contexto.Provider value={{ sincronizando, sincronizar, rodada }}>{children}</Contexto.Provider>
  );
}

export function useSincronizacao() {
  return useContext(Contexto);
}

export function BotaoSincronizar({ className = 'botao' }: { className?: string }) {
  const { sincronizando, sincronizar } = useSincronizacao();
  return (
    <button className={className} onClick={() => void sincronizar()} disabled={sincronizando}>
      <RefreshCw size={16} className={sincronizando ? 'girando' : undefined} />
      {sincronizando ? 'Sincronizando…' : 'Sincronizar IXC'}
    </button>
  );
}
