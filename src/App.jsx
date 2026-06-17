import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { mockDB } from './data/mockDB'; 
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
  // 1. Inicializamos los estados leyendo directamente del mockDB
  const [clientes, setClientesState] = useState(() => mockDB.getClientes());
  const [servicios, setServiciosState] = useState(() => mockDB.getServicios());

  // 2. Interceptor personalizado para guardar Clientes en LocalStorage automáticamente
  const setClientes = (nuevoValor) => {
    if (typeof nuevoValor === 'function') {
      setClientesState((prev) => {
        const calculado = nuevoValor(prev);
        mockDB.saveClientes(calculado);
        return calculado;
      });
    } else {
      mockDB.saveClientes(nuevoValor);
      setClientesState(nuevoValor);
    }
  };

  // 3. Interceptor personalizado para guardar Servicios en LocalStorage automáticamente
  const setServicios = (nuevoValor) => {
    if (typeof nuevoValor === 'function') {
      setServiciosState((prev) => {
        const calculado = nuevoValor(prev);
        mockDB.saveServicios(calculado);
        return calculado;
      });
    } else {
      mockDB.saveServicios(nuevoValor);
      setServiciosState(nuevoValor);
    }
  };

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
            element={
              <Clientes 
                clientes={clientes} 
                setClientes={setClientes} 
                catalogoServicios={servicios} 
              />
            } 
          />
          
          <Route 
            path="/servicios" 
            element={
              <Servicios 
                servicios={servicios} 
                setServicios={setServicios} 
              />
            } 
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