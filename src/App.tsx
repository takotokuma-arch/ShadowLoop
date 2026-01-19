import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout/Layout';
import { LibraryPage } from './pages/LibraryPage';
import { CreatePage } from './pages/CreatePage';
import { PlayerPage } from './pages/PlayerPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Toaster position="top-center" toastOptions={{
            style: {
              background: '#334155',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }} />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<LibraryPage />} />
              <Route path="create" element={<CreatePage />} />
              <Route path="player/:id" element={<PlayerPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
