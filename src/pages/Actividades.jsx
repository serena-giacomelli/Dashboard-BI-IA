import { useState } from 'react';
import { actividadesArca, actividadesRuca, actividadesSenasa } from '../data/mockDB.js';
import '../styles/Actividades.css';

const Actividades = () => {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('asc'); 
  const [capaActiva, setCapaActiva] = useState('ARCA'); 

  const obtenerCatalogo = () => {
    if (capaActiva === 'ARCA') return actividadesArca;
    if (capaActiva === 'RUCA') return actividadesRuca;
    return actividadesSenasa;
  };

  const actividadesFiltradas = obtenerCatalogo().filter((item) =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const actividadesOrdenadas = [...actividadesFiltradas].sort((a, b) => {
    const comparacion = a.nombre.localeCompare(b.nombre, 'es');
    return orden === 'asc' ? comparacion : -comparacion;
  });

  const toggleOrden = () => {
    setOrden(orden === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="actividades-wrapper">
      <div className="actividades-header">
        <div>
          <h2>Catálogo de Actividades</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {['ARCA', 'RUCA', 'SENASA'].map((capa) => (
            <button
              key={capa}
              onClick={() => {
                setCapaActiva(capa);
                setBusqueda(''); 
              }}
              className={`btn-capa ${capaActiva === capa ? 'activa' : ''}`}
            >
              {capa}
            </button>
          ))}
        </div>
      </div>
      <div className="buscador-container">
        <input
          type="text"
          placeholder={`Buscar por código o nombre en ${capaActiva}...`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-buscador-act"/>
      </div>

      <div className="tabla-panel-act">
        <div className="tabla-scroll-act">
          <table className="tabla-nomenclador">
            <thead>
              <tr>
                <th className="th-codigo">Código</th>
                <th onClick={toggleOrden} className="th-ordenable">
                  Nombre {orden === 'asc' ? '▲' : '▼'}
                </th>
                {capaActiva === 'ARCA' && (
                  <th className="th-vinculos">Vinculaciones (RUCA / SENASA)</th>
                )}
              </tr>
            </thead>
            <tbody>
              {actividadesOrdenadas.length > 0 ? (
                actividadesOrdenadas.map((item) => (
                  <tr key={item.codigo}>
                    <td className="td-codigo-arca">{item.codigo}</td>
                    <td className="td-nombre-act">{item.nombre}</td>
                    
                    {capaActiva === 'ARCA' && (
                      <td className="td-vinculos">
                        RUCA: {item.vinculos?.ruca?.length > 0 ? item.vinculos.ruca.join(', ') : '-'} <br/>
                        SENASA: {item.vinculos?.senasa?.length > 0 ? item.vinculos.senasa.join(', ') : '-'}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr className="sin-resultados-act">
                  <td colSpan={capaActiva === 'ARCA' ? 3 : 2}>
                    No se encontraron actividades en {capaActiva}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Actividades;