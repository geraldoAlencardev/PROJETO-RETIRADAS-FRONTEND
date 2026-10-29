import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProvedorSessao, useSessao } from './auth/Sessao';
import { ProvedorAvisos } from './components/Avisos';
import { Layout } from './components/Layout';
import { ProvedorSincronizacao } from './components/Sincronizacao';
import { Carregando } from './components/ui';
import { Agenda } from './pages/Agenda';
import { Dashboard } from './pages/Dashboard';
import { RetiradaDetalhe } from './pages/detalhe/RetiradaDetalhe';
import { Login } from './pages/Login';
import { Pendencias } from './pages/Pendencias';
import { Retiradas } from './pages/Retiradas';
import { Usuarios } from './pages/Usuarios';
import './styles/global.css';

/** Só deixa passar com sessão; sem ela, vai para o login. */
function Protegido() {
  const { usuario, verificando } = useSessao();
  const local = useLocation();
  if (verificando) return <Carregando texto="Verificando sessão…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  return (
    <ProvedorSincronizacao>
      <Layout />
    </ProvedorSincronizacao>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorAvisos>
        <ProvedorSessao>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Protegido />}>
              <Route index element={<Dashboard />} />
              <Route path="retiradas" element={<Retiradas />} />
              <Route path="retiradas/:id" element={<RetiradaDetalhe />} />
              <Route path="pendencias" element={<Pendencias />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProvedorSessao>
      </ProvedorAvisos>
    </BrowserRouter>
  </StrictMode>,
);
