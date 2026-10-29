import type { StatusOs } from '../api/tipos';

export const STATUS_INFO: Record<StatusOs, { rotulo: string; cor: string }> = {
  PENDENTE: { rotulo: 'Pendente', cor: 'var(--ambar)' },
  EM_CONTATO: { rotulo: 'Em contato', cor: 'var(--azul)' },
  AGENDADA: { rotulo: 'Agendada', cor: 'var(--ciano)' },
  ATRASADA: { rotulo: 'Atrasada', cor: 'var(--vermelho)' },
  EM_EXTRAVIO: { rotulo: 'Em extravio', cor: 'var(--laranja)' },
  MULTA_GERADA: { rotulo: 'Multa gerada', cor: '#f87171' },
  EM_REATIVACAO: { rotulo: 'Em reativação', cor: 'var(--roxo)' },
  REATIVACAO_CONCLUIDA: { rotulo: 'Reativação concluída', cor: 'var(--verde)' },
  RETIRADA_OK: { rotulo: 'Retirada OK', cor: 'var(--verde)' },
};

export const STATUS_FINAIS: StatusOs[] = ['RETIRADA_OK', 'REATIVACAO_CONCLUIDA', 'MULTA_GERADA'];

/** Status do chamado no IXC (só consulta). */
export const STATUS_IXC: Record<string, string> = {
  A: 'Aberta',
  AN: 'Análise',
  EN: 'Encaminhada',
  AS: 'Assumida',
  AG: 'Agendada',
  DS: 'Deslocamento',
  EX: 'Execução',
  F: 'Finalizada',
  RAG: 'Aguardando agendamento',
};

/** Nome dos tipos de evento do histórico, para a linha do tempo. */
export const TIPO_EVENTO: Record<string, string> = {
  RECEBIMENTO: 'OS recebida',
  TENTATIVA_CONTATO: 'Tentativa de contato',
  AGENDAMENTO: 'Agendamento',
  REAGENDAMENTO: 'Reagendamento',
  REVERSAO_AGENDAMENTO: 'Agendamento revertido',
  MUDANCA_STATUS: 'Mudança de status',
  CONCLUSAO: 'Conclusão',
  SINCRONIZACAO: 'Sincronização IXC',
};
