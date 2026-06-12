import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { initialClientes } from './data/clientesDB';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Detail from './pages/Detail';
import EditorBoletin from './components/EditorBoletin';
import EditorNovedades from './components/EditorNovedades'; // <--- Import nuevo
import Clientes from './pages/Clientes'; 
import styles from './styles/AppShell.module.css';

function App() {
  const [clientes, setClientes] = useState(initialClientes);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/detalle" element={<Detail />} />
          <Route path="/clientes" element={<Clientes clientes={clientes} setClientes={setClientes} />} />
          <Route path="/boletines" element={<EditorBoletin clientesDB={clientes} />} />
          <Route path="/novedades" element={<EditorNovedades clientesDB={clientes} />} /> {/* <--- Ruta nueva */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;