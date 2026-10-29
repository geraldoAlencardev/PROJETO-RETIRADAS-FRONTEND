import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { StatusOs } from '../api/tipos';
import { comCor, fmtNumero } from '../lib/formato';
import { STATUS_INFO, STATUS_IXC } from '../lib/status';

export function SeloStatus({ status }: { status: StatusOs }) {
  const info = STATUS_INFO[status];
  return (
    <span className="selo" style={{ color: info.cor }}>
      {info.rotulo}
    </span>
  );
}

export function SeloIxc({ status }: { status: string | null }) {
  if (!status) return <span className="fraco">--</span>;
  return (
    <span className="selo-ixc" title={`IXC: ${STATUS_IXC[status] ?? status}`}>
      {status}
    </span>
  );
}

export function Cartao(props: {
  rotulo: string;
  valor: number | string;
  cor?: string;
  icone?: ReactNode;
  compacto?: boolean;
  alerta?: boolean;
  para?: string;
  rodape?: ReactNode;
}) {
  const classe = `cartao${props.compacto ? ' compacto' : ''}${props.alerta ? ' alerta' : ''}`;
  const valor = typeof props.valor === 'number' ? fmtNumero(props.valor) : props.valor;
  const conteudo = (
    <>
      <span className="rotulo" style={props.alerta ? { color: 'var(--vermelho)' } : undefined}>
        {props.rotulo}
      </span>
      <span
        className="cartao-valor"
        style={props.alerta ? { color: 'var(--vermelho)' } : undefined}
      >
        {valor}
      </span>
      {props.rodape}
      {props.icone && <span className="cartao-icone">{props.icone}</span>}
    </>
  );
  const estilo = props.cor ? comCor(props.cor) : undefined;
  return props.para ? (
    <Link to={props.para} className={classe} style={estilo}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe} style={estilo}>
      {conteudo}
    </div>
  );
}

export function Painel(props: {
  titulo: ReactNode;
  icone?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  semPadding?: boolean;
  className?: string;
}) {
  return (
    <section className={`painel ${props.className ?? ''}`}>
      <div className="painel-topo">
        {props.icone}
        <span className="rotulo" style={{ color: 'var(--texto)' }}>
          {props.titulo}
        </span>
        <span className="espaco" />
        {props.extra}
      </div>
      {props.semPadding ? props.children : <div className="painel-corpo">{props.children}</div>}
    </section>
  );
}

export function Modal(props: {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
  acoes: ReactNode;
}) {
  useEffect(() => {
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && props.aoFechar();
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [props]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && props.aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={props.titulo}>
        <div className="painel-topo">
          <span className="rotulo" style={{ color: 'var(--texto)' }}>
            {props.titulo}
          </span>
          <span className="espaco" />
          <button className="icone-botao" onClick={props.aoFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-corpo">{props.children}</div>
        <div className="modal-acoes">{props.acoes}</div>
      </div>
    </div>
  );
}

export function Paginacao(props: {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamanho: number;
  quantidade: number;
  aoMudar: (pagina: number) => void;
}) {
  const { pagina, totalPaginas, total, tamanho, quantidade } = props;
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanho + 1;
  const fim = (pagina - 1) * tamanho + quantidade;

  // Primeira, última e vizinhas da atual; "…" nos buracos.
  const paginas: (number | '…')[] = [];
  for (let p = 1; p <= totalPaginas; p++) {
    if (p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1) paginas.push(p);
    else if (paginas[paginas.length - 1] !== '…') paginas.push('…');
  }

  return (
    <div className="paginacao">
      <span className="sutil">
        Mostrando {inicio} a {fim} de {fmtNumero(total)} registros
      </span>
      <span className="espaco" />
      <button disabled={pagina <= 1} onClick={() => props.aoMudar(pagina - 1)} aria-label="Anterior">
        <ChevronLeft size={16} />
      </button>
      {paginas.map((p, i) =>
        p === '…' ? (
          <span key={`r${i}`} className="sutil">
            …
          </span>
        ) : (
          <button key={p} className={p === pagina ? 'atual' : undefined} onClick={() => props.aoMudar(p)}>
            {p}
          </button>
        ),
      )}
      <button
        disabled={pagina >= totalPaginas}
        onClick={() => props.aoMudar(pagina + 1)}
        aria-label="Próxima"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return <div className="carregando">{texto}</div>;
}

export function ErroCarga({ erro, tentar }: { erro: string; tentar: () => void }) {
  return (
    <div className="painel painel-corpo linha-flex">
      <span className="vermelho">{erro}</span>
      <span className="espaco" />
      <button className="botao pequeno" onClick={tentar}>
        Tentar de novo
      </button>
    </div>
  );
}
