// Formatos devolvidos pela API (PROJETO-RETIRADAS). Datas chegam como texto ISO.

export const STATUS_OS = [
  'PENDENTE',
  'EM_CONTATO',
  'AGENDADA',
  'ATRASADA',
  'EM_EXTRAVIO',
  'MULTA_GERADA',
  'EM_REATIVACAO',
  'REATIVACAO_CONCLUIDA',
  'RETIRADA_OK',
] as const;

export type StatusOs = (typeof STATUS_OS)[number];

export const CANAIS = ['TELEFONE', 'WHATSAPP', 'EMAIL', 'OUTRO'] as const;
export type Canal = (typeof CANAIS)[number];

export type TipoMotivo = 'CLIENTE' | 'EMPRESA';

export interface Usuario {
  id: string;
  nome: string;
  login: string;
}

export interface UsuarioCompleto extends Usuario {
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Os {
  id: string;
  osExternaId: string;
  protocoloExterno: string | null;
  clienteNome: string | null;
  clienteExternoId: string | null;
  contratoId: string;
  bairro: string | null;
  endereco: string;
  referencia: string | null;
  dataAbertura: string;
  status: StatusOs;
  statusExterno: string | null;
  dataEntradaStatus: string;
  dataUltimaInteracao: string | null;
  qtdTentativasContato: number;
  qtdTentativasSemSucesso: number;
  qtdFalhasCiclo: number;
  reagendamentosCliente: number;
  reagendamentosEmpresa: number;
  dataPrevista: string | null;
  horarioPrevisto: string | null;
  atualizadoEm: string;
}

export interface OsDetalhe extends Os {
  agendamentoVigente: { dataPrevista: string; horario: string | null } | null;
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanho: number;
  totalPaginas: number;
}

export interface Resumo {
  total: number;
  porStatus: Record<StatusOs, number>;
  reagendamentos: { cliente: number; empresa: number };
}

export interface EventoHistorico {
  id: string;
  dataHora: string;
  tipoEvento: string;
  descricao: string;
  motivo: string | null;
  usuarioNome: string | null;
}

export interface Tentativa {
  id: string;
  dataHora: string;
  canal: Canal;
  sucesso: boolean;
  observacao: string | null;
  usuarioNome: string;
}

export interface Agendamento {
  id: string;
  dataPrevista: string;
  horario: string | null;
  dataHoraRegistro: string;
  vigente: boolean;
  tipoMotivo: TipoMotivo | null;
  motivoDetalhe: string | null;
  usuarioNome: string;
}

export interface Transicao {
  de: StatusOs;
  para: StatusOs;
  codigo: string | null;
}

export interface Sincronizacao {
  id: string;
  usuarioNome: string;
  iniciadaEm: string;
  finalizadaEm: string | null;
  situacao: 'EM_ANDAMENTO' | 'CONCLUIDA' | 'FALHOU';
  paginas: number;
  recebidos: number;
  criadas: number;
  atualizadas: number;
  finalizadas: number;
  ignoradas: number;
  comErro: number;
  erro: string | null;
}

/** Ações manuais de POST /os/:id/acoes. */
export type AcaoOs = 'CONCLUIR_RETIRADA' | 'GERAR_MULTA' | 'INICIAR_REATIVACAO' | 'CONCLUIR_REATIVACAO';
