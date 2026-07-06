import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Teorie from './pages/Teorie';
import Probleme from './pages/Probleme'
import Scoruri from './pages/Scoruri'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/teorie" element={<Teorie />} />
          <Route path="/probleme" element={<Probleme />} />
          <Route path="/scoruri" element={<Scoruri />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}