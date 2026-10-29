// Formatação de datas e números no padrão brasileiro.

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const numero = new Intl.NumberFormat('pt-BR');

/** Instante ISO → 'DD/MM/AAAA HH:MM'. */
export function fmtDataHora(iso: string | null | undefined): string {
  if (!iso) return '--';
  return dataHora.format(new Date(iso)).replace(',', '');
}

/** Data de negócio 'AAAA-MM-DD' → 'DD/MM/AAAA' (sem conversão de fuso). */
export function fmtData(iso: string | null | undefined): string {
  if (!iso) return '--';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function fmtNumero(n: number): string {
  return numero.format(n);
}

export function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Tempo decorrido desde o instante, ex.: '48h 12m', '3d 4h'. */
export function tempoDesde(iso: string | null | undefined, agora = Date.now()): string {
  if (!iso) return '--';
  const minutos = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60_000));
  if (minutos < 60) return `${minutos}m`;
  const horas = Math.floor(minutos / 60);
  if (horas < 72) return `${horas}h ${minutos % 60}m`;
  return `${Math.floor(horas / 24)}d ${horas % 24}h`;
}

export function horasDesde(iso: string | null | undefined, agora = Date.now()): number {
  if (!iso) return 0;
  return (agora - new Date(iso).getTime()) / 3_600_000;
}

/** 'há 2 horas', 'há 3 dias'. */
export function haQuanto(iso: string | null | undefined, agora = Date.now()): string {
  if (!iso) return 'nunca';
  const minutos = Math.floor((agora - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/** Data de hoje 'AAAA-MM-DD' no fuso do navegador. */
export function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

/** Nome exibido do cliente: o nome, ou o código do IXC enquanto o nome não vem. */
export function nomeCliente(os: { clienteNome: string | null; clienteExternoId: string | null }) {
  return os.clienteNome ?? (os.clienteExternoId ? `Cliente #${os.clienteExternoId}` : '--');
}

/** Estilo que define a variável --cor (usada pelos cartões, selos e barras). */
export function comCor(cor: string): import('react').CSSProperties {
  return { '--cor': cor } as import('react').CSSProperties;
}
