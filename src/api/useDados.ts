import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrega dados de uma função assíncrona e recarrega quando `deps` mudam.
 * Ignora respostas que chegam fora de ordem (ex.: troca rápida de página).
 */
export function useDados<T>(carregar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | undefined>(undefined);
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [carregando, setCarregando] = useState(true);
  const versao = useRef(0);

  const executar = useCallback(carregar, deps);

  const recarregar = useCallback(async () => {
    const minha = ++versao.current;
    setCarregando(true);
    try {
      const resultado = await executar();
      if (minha === versao.current) {
        setDados(resultado);
        setErro(undefined);
      }
    } catch (e) {
      if (minha === versao.current) setErro(e instanceof Error ? e.message : String(e));
    } finally {
      if (minha === versao.current) setCarregando(false);
    }
  }, [executar]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { dados, erro, carregando, recarregar };
}
