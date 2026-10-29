import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { comCor } from '../lib/formato';

type Tipo = 'sucesso' | 'erro' | 'info';

interface Aviso {
  id: number;
  tipo: Tipo;
  texto: string;
}

const CORES: Record<Tipo, string> = {
  sucesso: 'var(--verde)',
  erro: 'var(--vermelho)',
  info: 'var(--acento)',
};

const Contexto = createContext<(texto: string, tipo?: Tipo) => void>(() => undefined);

let proximoId = 1;

/** Avisos temporários no canto da tela (sucesso de ação, erro da API etc.). */
export function ProvedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((texto: string, tipo: Tipo = 'info') => {
    const id = proximoId++;
    setAvisos((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), 6000);
  }, []);

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className="aviso" style={comCor(CORES[a.tipo])}>
            {a.texto}
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useAvisos() {
  return useContext(Contexto);
}
