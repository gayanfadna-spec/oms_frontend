import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

import OrderEntry from './pages/OrderEntry';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Products from './pages/Products';
import CreateAgent from './pages/CreateAgent';
import Reports from './pages/Reports';
//dfdddsd
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>; // Or a spinner
  if (!user) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        {/* Placeholders for other routes */}
        <Route path="order/new" element={<OrderEntry />} />
        <Route path="order/edit/:id" element={<OrderEntry />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="agents/new" element={<CreateAgent />} />
        <Route path="products" element={<Products />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

