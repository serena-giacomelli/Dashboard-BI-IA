import { useState } from 'react';
import { actividadesArca } from '../data/mockDB.js';
import '../styles/Actividades.css';

const Actividades = () => {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('asc'); 

  const actividadesFiltradas = actividadesArca.filter((item) =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.codigo.includes(busqueda)
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
      </div>

      <div className="buscador-container">
        <input
          type="text"
          placeholder="Buscar por código o nombre de actividad ARCA..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-buscador-act"
        />
      </div>

      <div className="tabla-panel-act">
        <div className="tabla-scroll-act">
          <table className="tabla-nomenclador">
            <thead>
              <tr>
                <th className="th-codigo">Código</th>
                <th onClick={toggleOrden} className="th-ordenable">
                  Nombre{orden === 'asc' ? '▲' : '▼'}
                  <span className="th-indicador-orden">(clic para ordenar)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {actividadesOrdenadas.length > 0 ? (
                actividadesOrdenadas.map((item) => (
                  <tr key={item.codigo}>
                    <td className="td-codigo-arca">
                      {item.codigo}
                    </td>
                    <td className="td-nombre-act">
                      {item.nombre}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="sin-resultados-act">
                  <td colSpan="2">
                    No se encontraron actividades.
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