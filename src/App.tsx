import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { LibraryPage } from './pages/LibraryPage';
import { CreatePage } from './pages/CreatePage';
import { PlayerPage } from './pages/PlayerPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LibraryPage />} />
            <Route path="create" element={<CreatePage />} />
            <Route path="player/:id" element={<PlayerPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
