import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { clientesData, serviciosData } from './data/mockDB'; 

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Detail from './pages/Detail';
import EditorBoletin from './components/EditorBoletin';
import EditorNovedades from './components/EditorNovedades'; 
import Clientes from './pages/Clientes'; 
import Servicios from './pages/Servicios'; 
import Actividades from './pages/Actividades'; 
import styles from './styles/AppShell.module.css';

function App() {
  const [clientes, setClientes] = useState(clientesData);
  const [servicios, setServicios] = useState(serviciosData);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        
        {/* 💡 ACÁ VA EL HEADER: Queda fijo en la parte superior del área de contenido */}
        <Header />

        {/* Podés envolver las rutas en un div con padding si sentís que queda muy pegado al header */}
        <div style={{ padding: '24px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/detalle" element={<Detail />} />
            
            <Route 
              path="/clientes" 
              element={<Clientes clientes={clientes} setClientes={setClientes} serviciosData={servicios} />} 
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
        </div>
      </main>
    </div>
  );
}

export default App;