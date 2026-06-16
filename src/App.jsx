// src/App.jsx
import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { initialClientes } from './data/clientesDB';
import { initialServicios } from './data/serviciosDB'; // Importamos la data
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Detail from './pages/Detail';
import EditorBoletin from './components/EditorBoletin';
import EditorNovedades from './components/EditorNovedades'; 
import Clientes from './pages/Clientes'; 
import Servicios from './pages/Servicios'; 
import Actividades from './pages/Actividades'; 
import styles from './styles/AppShell.module.css';

function App() {
  const [clientes, setClientes] = useState(initialClientes);
  // Usamos el archivo externo para inicializar el estado
  const [servicios, setServicios] = useState(initialServicios);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/detalle" element={<Detail />} />
                    <Route 
            path="/clientes" 
            element={<Clientes clientes={clientes} setClientes={setClientes} catalogoServicios={servicios} />} 
          />
          <Route 
            path="/servicios" 
            element={<Servicios servicios={servicios} setServicios={setServicios} />} 
          />
          
          <Route path="/actividades" element={<Actividades />} /> 
          <Route path="/boletines" element={<EditorBoletin clientesDB={clientes} />} />
          <Route path="/novedades" element={<EditorNovedades clientesDB={clientes} />} /> 
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;