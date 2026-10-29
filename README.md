# OS Retirada — Frontend

Interface web (React + Vite + TypeScript) do Sistema de Gestão de OS de Retirada de Equipamentos.
Consome a API do projeto irmão `PROJETO-RETIRADAS`.

## Rodando em desenvolvimento

1. Suba a API (em `../PROJETO-RETIRADAS`): `npm run db:up` e `npm run dev` (porta 3000).
2. Aqui:

```bash
npm install
npm run dev          # http://localhost:5173
```

O Vite repassa `/api/*` para `http://localhost:3000` (sem o prefixo `/api`), então front e API
ficam na mesma origem e o cookie de sessão funciona sem CORS. Para outra URL da API:
`API_URL=http://outro-host:3000 npm run dev`.

Para entrar é preciso um usuário: `npm run user:create -- --login admin --nome "Administrador"`
na API.

## Telas

- **Dashboard** — contagem por status, reagendamentos cliente × empresa, OS que pedem atenção.
- **Retiradas** — fila com busca, filtro por status e paginação.
- **Detalhe da retirada** — dados de origem (IXC), status, ações conforme o status
  (registrar contato, agendar/reagendar, reverter, concluir, multa, reativação),
  tentativas, histórico de agendamentos e linha do tempo.
- **Pendências** — aguardando primeiro contato, tentativas sem sucesso e em extravio.
- **Agenda** — retiradas agendadas por dia.
- **Usuários** — criar, editar, trocar senha, desativar.
- **Sincronizar IXC** — botão no menu; o IXC é apenas origem de dados (nada é enviado a ele).

## Scripts

`npm run dev` · `npm run build` · `npm run preview` · `npm run typecheck`
