import { SquareTerminal } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSessao } from '../auth/Sessao';

export function Login() {
  const { usuario, entrar } = useSessao();
  const navegar = useNavigate();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(undefined);
    setEnviando(true);
    try {
      await entrar(login.trim(), senha);
      navegar('/', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login">
      <form className="painel" onSubmit={enviar}>
        <div className="painel-topo">
          <span className="marca-icone">
            <SquareTerminal size={18} />
          </span>
          <div>
            <div className="marca-nome">OS_RETIRADA</div>
            <div className="marca-sub">Acesso ao painel</div>
          </div>
        </div>
        <div className="modal-corpo">
          <label className="campo">
            <span>LOGIN</span>
            <input
              className="entrada"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label className="campo">
            <span>SENHA</span>
            <input
              className="entrada"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {erro && <div className="erro-form">{erro}</div>}
          <button className="botao primario bloco" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
