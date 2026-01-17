import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TablesPage from './pages/TablesPage';
import TableDetailPage from './pages/TableDetailPage';
import KitchenPage from './pages/KitchenPage';
import MenuPage from './pages/MenuPage';
import WaitersPage from './pages/WaitersPage';
import { PaymentPage } from './pages/PaymentPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/tables" replace />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="tables/:id" element={<TableDetailPage />} />
          <Route path="tabs/:tabId/payment" element={<PaymentPage />} />
          <Route path="kitchen" element={<KitchenPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="waiters" element={<WaitersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
