import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, definirAoPerderSessao } from '../api/cliente';
import type { Usuario } from '../api/tipos';

interface ContextoSessao {
  usuario: Usuario | null;
  /** true enquanto verifica se já existe sessão (primeira carga). */
  verificando: boolean;
  entrar: (login: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    definirAoPerderSessao(() => setUsuario(null));
    api
      .eu()
      .then((r) => setUsuario(r.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setVerificando(false));
  }, []);

  const entrar = useCallback(async (login: string, senha: string) => {
    const r = await api.login(login, senha);
    setUsuario(r.usuario);
  }, []);

  const sair = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setUsuario(null);
  }, []);

  return (
    <Contexto.Provider value={{ usuario, verificando, entrar, sair }}>{children}</Contexto.Provider>
  );
}

export function useSessao(): ContextoSessao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useSessao fora do ProvedorSessao');
  return ctx;
}
