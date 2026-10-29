import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Search,
  SquareTerminal,
  Truck,
  UserCircle,
  Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSessao } from '../auth/Sessao';
import { BotaoSincronizar } from './Sincronizacao';

const MENU = [
  { para: '/', rotulo: 'Dashboard', icone: LayoutDashboard },
  { para: '/retiradas', rotulo: 'Retiradas', icone: Truck },
  { para: '/pendencias', rotulo: 'Pendências', icone: ClipboardList },
  { para: '/agenda', rotulo: 'Agenda', icone: CalendarDays },
  { para: '/usuarios', rotulo: 'Usuários', icone: Users },
];

export function Layout() {
  const { usuario, sair } = useSessao();
  const navegar = useNavigate();
  const [busca, setBusca] = useState('');

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const termo = busca.trim();
    navegar(termo ? `/retiradas?busca=${encodeURIComponent(termo)}` : '/retiradas');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="marca">
          <span className="marca-icone">
            <SquareTerminal size={20} />
          </span>
          <div>
            <div className="marca-nome">OS_RETIRADA</div>
            <div className="marca-sub">Painel operacional</div>
          </div>
        </div>

        <BotaoSincronizar className="botao primario bloco" />

        <nav className="nav">
          {MENU.map(({ para, rotulo, icone: Icone }) => (
            <NavLink key={para} to={para} end={para === '/'} className={({ isActive }) => (isActive ? 'ativo' : '')}>
              <Icone size={20} />
              {rotulo}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-rodape">
          <div className="usuario">
            <UserCircle size={20} />
            <div>
              <div>{usuario?.nome}</div>
              <div className="fraco" style={{ fontSize: 12 }}>
                {usuario?.login}
              </div>
            </div>
          </div>
          <nav className="nav" style={{ marginTop: 0 }}>
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                void sair().then(() => navegar('/login'));
              }}
            >
              <LogOut size={20} />
              Sair
            </a>
          </nav>
        </div>
      </aside>

      <div className="principal">
        <header className="topo">
          <form className="busca" onSubmit={buscar} role="search">
            <Search size={16} className="sutil" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar OS, protocolo, contrato, cliente ou bairro…"
              aria-label="Buscar"
            />
          </form>
          <span className="espaco" />
          <span className="rotulo fraco">Terminal v1.0</span>
        </header>
        <main className="conteudo">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
