import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Părintele tuturor paginilor este Layout-ul */}
        <Route path="/" element={<DashboardLayout />}>
          
          {/* Când ești exact pe "/", se va încărca DashboardPage în interiorul Outlet-ului */}
          <Route index element={<DashboardPage />} />
          
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}