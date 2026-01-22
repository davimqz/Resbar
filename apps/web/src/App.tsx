import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import TablesPage from './pages/TablesPage';
import TableDetailPage from './pages/TableDetailPage';
import KitchenPage from './pages/KitchenPage';
import MenuPage from './pages/MenuPage';
import WaitersPage from './pages/WaitersPage';
import { PaymentPage } from './pages/PaymentPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { UserRole } from '@resbar/shared';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/tables" replace />} />
          
          {/* Rotas acessíveis a todos usuários autenticados */}
          <Route path="tables" element={<TablesPage />} />
          <Route path="tables/:id" element={<TableDetailPage />} />
          <Route path="tabs/:tabId/payment" element={<PaymentPage />} />
          
          {/* Rotas para Cozinha */}
          <Route
            path="kitchen"
            element={
              <ProtectedRoute allowedRoles={[UserRole.KITCHEN, UserRole.ADMIN]}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          
          {/* Rotas para Garçom/Admin */}
          <Route
            path="menu"
            element={
              <ProtectedRoute allowedRoles={[UserRole.WAITER, UserRole.ADMIN]}>
                <MenuPage />
              </ProtectedRoute>
            }
          />
          
          {/* Rotas para Staff (Garçom, Cozinha, Admin) */}
          <Route
            path="inventory"
            element={
              <ProtectedRoute allowedRoles={[UserRole.WAITER, UserRole.KITCHEN, UserRole.ADMIN]}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          
          {/* Rotas apenas para Admin */}
          <Route
            path="waiters"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <WaitersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
