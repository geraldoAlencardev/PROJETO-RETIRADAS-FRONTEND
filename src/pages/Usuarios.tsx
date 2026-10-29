import { Pencil, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api/cliente';
import type { UsuarioCompleto } from '../api/tipos';
import { useDados } from '../api/useDados';
import { useSessao } from '../auth/Sessao';
import { useAvisos } from '../components/Avisos';
import { Carregando, ErroCarga, Modal } from '../components/ui';
import { fmtDataHora } from '../lib/formato';

function ModalUsuario(props: { usuario?: UsuarioCompleto; aoFechar: () => void; aoSalvar: () => void }) {
  const avisar = useAvisos();
  const editando = Boolean(props.usuario);
  const [nome, setNome] = useState(props.usuario?.nome ?? '');
  const [login, setLogin] = useState(props.usuario?.login ?? '');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const salvar = async () => {
    setEnviando(true);
    setErro(undefined);
    try {
      if (props.usuario) {
        await api.editarUsuario(props.usuario.id, {
          nome: nome.trim() !== props.usuario.nome ? nome.trim() : undefined,
          senha: senha || undefined,
        });
        avisar('Usuário atualizado.', 'sucesso');
      } else {
        await api.criarUsuario({ nome: nome.trim(), login: login.trim(), senha });
        avisar('Usuário criado.', 'sucesso');
      }
      props.aoSalvar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo={editando ? 'Editar usuário' : 'Novo usuário'}
      aoFechar={props.aoFechar}
      acoes={
        <>
          <button className="botao" onClick={props.aoFechar}>
            Cancelar
          </button>
          <button className="botao primario" form="form-usuario" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <form
        id="form-usuario"
        className="grade"
        onSubmit={(e) => {
          e.preventDefault();
          void salvar();
        }}
      >
        <label className="campo">
          <span>NOME</span>
          <input className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={150} />
        </label>
        <label className="campo">
          <span>LOGIN</span>
          <input
            className="entrada"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            disabled={editando}
            required
            pattern="[A-Za-z0-9._\-]{3,100}"
            title="De 3 a 100 caracteres: letras, números, ponto, _ ou -"
          />
        </label>
        <label className="campo">
          <span>{editando ? 'NOVA SENHA (deixe em branco para manter)' : 'SENHA'}</span>
          <input
            className="entrada"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required={!editando}
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        {erro && <div className="erro-form">{erro}</div>}
      </form>
    </Modal>
  );
}

export function Usuarios() {
  const { usuario: eu } = useSessao();
  const avisar = useAvisos();
  const lista = useDados(() => api.usuarios(), []);
  const [editando, setEditando] = useState<UsuarioCompleto | 'novo' | null>(null);

  const alternarAtivo = async (u: UsuarioCompleto) => {
    try {
      await api.editarUsuario(u.id, { ativo: !u.ativo });
      avisar(u.ativo ? `${u.nome} desativado.` : `${u.nome} reativado.`, 'sucesso');
      void lista.recarregar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : String(e), 'erro');
    }
  };

  if (lista.erro) return <ErroCarga erro={lista.erro} tentar={lista.recarregar} />;
  if (!lista.dados) return <Carregando />;

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Usuários</h1>
          <p>Perfil único: todos os usuários podem operar todas as OS.</p>
        </div>
        <span className="espaco" />
        <button className="botao primario" onClick={() => setEditando('novo')}>
          <UserPlus size={16} /> Novo usuário
        </button>
      </div>

      <div className="painel">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Login</th>
              <th>Situação</th>
              <th>Criado em</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.dados.itens.map((u) => (
              <tr key={u.id} style={u.ativo ? undefined : { opacity: 0.55 }}>
                <td>
                  {u.nome}
                  {u.id === eu?.id && <span className="fraco"> (você)</span>}
                </td>
                <td className="sutil">{u.login}</td>
                <td>{u.ativo ? <span className="verde">Ativo</span> : <span className="fraco">Inativo</span>}</td>
                <td className="sutil">{fmtDataHora(u.criadoEm)}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="linha-flex" style={{ justifyContent: 'flex-end' }}>
                    <button className="botao pequeno" onClick={() => setEditando(u)}>
                      <Pencil size={14} /> Editar
                    </button>
                    {u.id !== eu?.id && (
                      <button
                        className={`botao pequeno${u.ativo ? ' perigo' : ''}`}
                        onClick={() => void alternarAtivo(u)}
                      >
                        {u.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <ModalUsuario
          usuario={editando === 'novo' ? undefined : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null);
            void lista.recarregar();
          }}
        />
      )}
    </>
  );
}
