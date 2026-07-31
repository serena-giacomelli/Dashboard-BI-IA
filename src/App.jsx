import { useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './utils/supabase.js';

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
import Presupuestos from './pages/Presupuestos.jsx';
import Tramites from './pages/Tramites.jsx';
import DirectoresTecnicos from './pages/DirectoresTecnicos.jsx';
import Organismos from './pages/Organismos.jsx';

function App() {
  // Iniciamos los estados vacíos
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);

useEffect(() => {
    async function cargarDatosGlobales() {
      try {
        // 1. Traemos los catálogos de servicios
        const { data: dataServicios, error: errServicios } = await supabase
          .from('servicio')
          .select('*');
        
        if (errServicios) throw errServicios;
        setServicios(dataServicios);

        // 2. Traemos los clientes con toda su data anidada
        const { data: dataClientes, error: errClientes } = await supabase
          .from('clientes')
          .select(`
            *,
            contactos:cliente_contactos(*),
            historia:cliente_historia(*),
            servicios:cliente_servicios(
              *, 
              actividadesCliente:cliente_servicio_actividades(organismo, codigo_actividad)
            )
          `);

        if (errClientes) throw errClientes;

        // 3. El TRADUCTOR: Transformamos snake_case a camelCase para que la UI lo entienda
        const clientesFormateados = dataClientes.map(cli => {
          const clienteAdaptado = {
            id: cli.id,
            razonSocial: cli.razon_social,
            cuit: cli.cuit,
            mailPrimario: cli.mail_primario,
            mailSecundario: cli.mail_secundario,
            saldo: cli.saldo,
            direccionAdministrativa: cli.direccion_administrativa,
            localidadAdmin: cli.localidad_admin,
            condicionFiscal: cli.condicion_fiscal,
            direccionEstablecimiento: cli.direccion_establecimiento,
            localidadEstablecimiento: cli.localidad_establecimiento,
            domicilioFiscal: cli.domicilio_fiscal,
            localidadFiscal: cli.localidad_fiscal,
            enviarBoletin: cli.enviar_boletin,
            enviarNovedades: cli.enviar_novedades,
            contactos: cli.contactos || [],
            historia: cli.historia || [],
            actividades: cli.actividades || []
          };

          if (cli.servicios) {
            clienteAdaptado.servicios = cli.servicios.map(srv => {
              const act = { arca: [], ruca: [], senasa: [] };
              if (srv.actividadesCliente) {
                srv.actividadesCliente.forEach(a => {
                  if (a.organismo === 'arca') act.arca.push(a.codigo_actividad);
                  if (a.organismo === 'ruca') act.ruca.push(a.codigo_actividad);
                  if (a.organismo === 'senasa') act.senasa.push(a.codigo_actividad);
                });
              }
              return {
                id: srv.id,
                servicio: srv.servicio,
                estado: srv.estado,
                fechaInicio: srv.fecha_inicio,
                fechaFin: srv.fecha_fin,
                usuarioAsignado: srv.usuario_asignado,
                contactoCliente: srv.contacto_cliente,
                contactoOrganismo: srv.contacto_organismo,
                directorTecnico: srv.director_tecnico,
                establecimiento: srv.establecimiento,
                obsInternas: srv.obs_internas,
                actividadesCliente: act
              };
            });
          } else {
            clienteAdaptado.servicios = [];
          }
          return clienteAdaptado;
        });

        setClientes(clientesFormateados);
      } catch (error) {
        console.error("Error cargando datos de Supabase:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatosGlobales();
  }, []);

  if (cargando) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando sistema...</div>;
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
          <Header />
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
              path="/presupuestos" 
              element={<Presupuestos />} 
            />
            <Route 
              path="/tramites" 
              element={<Tramites />} 
            />
            <Route 
              path="/servicios" 
              element={<Servicios servicios={servicios} setServicios={setServicios} />} 
            />
            <Route 
              path="/directores-tecnicos" 
              element={<DirectoresTecnicos />} 
            />
            <Route path="/organismos" element={<Organismos />} />
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