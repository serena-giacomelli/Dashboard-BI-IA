import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Detail from './pages/Detail';
import EditorBoletin from './components/EditorBoletin'; // <-- Importamos el editor
import styles from './styles/AppShell.module.css';

function App() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/informes" element={<Navigate to="/dashboard" replace />} />
          <Route path="/detalle" element={<Detail />} />
          
          {/* Nueva ruta para la sección de Boletines */}
          <Route path="/boletines" element={<EditorBoletin />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;