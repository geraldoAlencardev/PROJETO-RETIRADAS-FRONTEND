// Chamadas à API. Tudo passa por /api (o Vite repassa para a API em desenvolvimento).
// A sessão é um cookie httpOnly: o navegador o envia sozinho.
import type {
  AcaoOs,
  Agendamento,
  Canal,
  EventoHistorico,
  Os,
  OsDetalhe,
  Pagina,
  Resumo,
  Sincronizacao,
  StatusOs,
  Tentativa,
  TipoMotivo,
  Transicao,
  Usuario,
  UsuarioCompleto,
} from './tipos';

const BASE = '/api';

export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    mensagem: string,
    public readonly corpo?: unknown,
  ) {
    super(mensagem);
    this.name = 'ErroApi';
  }
}

/** Chamado quando a sessão expira (401), para o app voltar ao login. */
let aoPerderSessao: (() => void) | undefined;
export function definirAoPerderSessao(fn: () => void) {
  aoPerderSessao = fn;
}

async function chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(BASE + caminho, {
      method: metodo,
      credentials: 'same-origin',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi(0, 'Não foi possível falar com a API. Ela está rodando?');
  }

  if (resposta.status === 204) return undefined as T;
  const texto = await resposta.text();
  const dados: unknown = texto ? safeJson(texto) : undefined;

  if (!resposta.ok) {
    if (resposta.status === 401 && caminho !== '/auth/login' && caminho !== '/auth/me') {
      aoPerderSessao?.();
    }
    const mensagem =
      (dados as { erro?: string } | undefined)?.erro ?? `Erro ${resposta.status} na API`;
    throw new ErroApi(resposta.status, mensagem, dados);
  }
  return dados as T;
}

function safeJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== '') busca.set(chave, String(valor));
  }
  const s = busca.toString();
  return s ? `?${s}` : '';
}

export const api = {
  // sessão
  login: (login: string, senha: string) =>
    chamar<{ usuario: Usuario }>('POST', '/auth/login', { login, senha }),
  logout: () => chamar<void>('POST', '/auth/logout'),
  eu: () => chamar<{ usuario: Usuario }>('GET', '/auth/me'),

  // OS
  listarOs: (f: { status?: StatusOs[]; busca?: string; pagina?: number; tamanho?: number }) =>
    chamar<Pagina<Os>>(
      'GET',
      `/os${query({
        status: f.status?.join(','),
        busca: f.busca,
        pagina: f.pagina,
        tamanho: f.tamanho,
      })}`,
    ),
  resumo: () => chamar<Resumo>('GET', '/os/resumo'),
  os: (id: string) => chamar<OsDetalhe>('GET', `/os/${id}`),
  historico: (id: string) => chamar<{ itens: EventoHistorico[] }>('GET', `/os/${id}/historico`),
  acao: (id: string, acao: AcaoOs, motivo?: string) =>
    chamar<{ transicao: Transicao; os: OsDetalhe }>('POST', `/os/${id}/acoes`, { acao, motivo }),

  // contato
  tentativas: (id: string) => chamar<{ itens: Tentativa[] }>('GET', `/os/${id}/tentativas`),
  registrarTentativa: (
    id: string,
    dados: { canal: Canal; sucesso: boolean; observacao?: string },
  ) => chamar<{ transicao: Transicao; os: OsDetalhe }>('POST', `/os/${id}/tentativas`, dados),

  // agendamento
  agendamentos: (id: string) => chamar<{ itens: Agendamento[] }>('GET', `/os/${id}/agendamentos`),
  agendar: (
    id: string,
    dados: {
      dataPrevista: string;
      horario?: string;
      tipoMotivo?: TipoMotivo;
      motivoDetalhe?: string;
    },
  ) => chamar<{ transicao: Transicao; os: OsDetalhe }>('POST', `/os/${id}/agendamentos`, dados),
  reverterAgendamento: (id: string, motivo: string) =>
    chamar<{ transicao: Transicao; os: OsDetalhe }>('POST', `/os/${id}/agendamentos/reverter`, {
      motivo,
    }),

  // sincronização com o IXC (só leitura do lado do IXC)
  sincronizar: () => chamar<{ id: string }>('POST', '/sincronizacoes'),
  sincronizacao: (id: string) => chamar<Sincronizacao>('GET', `/sincronizacoes/${id}`),
  ultimaSincronizacao: () => chamar<Sincronizacao>('GET', '/sincronizacoes/ultima'),

  // usuários
  usuarios: () => chamar<{ itens: UsuarioCompleto[] }>('GET', '/usuarios'),
  criarUsuario: (dados: { nome: string; login: string; senha: string }) =>
    chamar<UsuarioCompleto>('POST', '/usuarios', dados),
  editarUsuario: (id: string, dados: { nome?: string; senha?: string; ativo?: boolean }) =>
    chamar<UsuarioCompleto>('PATCH', `/usuarios/${id}`, dados),
};
