import { useState } from 'react';
import { actividadesArca } from '../data/mockDB.js';

const Actividades = () => {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('asc'); // 'asc' (A-Z) o 'desc' (Z-A)

  // 1. Filtrado
  const actividadesFiltradas = actividadesArca.filter((item) =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.codigo.includes(busqueda)
  );

  // 2. Ordenamiento
  const actividadesOrdenadas = [...actividadesFiltradas].sort((a, b) => {
    const comparacion = a.nombre.localeCompare(b.nombre, 'es');
    return orden === 'asc' ? comparacion : -comparacion;
  });

  // Alternar el orden
  const toggleOrden = () => {
    setOrden(orden === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#334155', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '25px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.5px' }}>MÓDULO OPERACIONES</span>
          <h2 style={{ margin: '2px 0 0 0', color: '#0f172a', fontSize: '24px' }}>Catálogo de Actividades</h2>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar por código o nombre de actividad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            outline: 'none'
          }}
        />
      </div>

      {/* TABLA */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px', width: '150px' }}>Código</th>
                {/* Encabezado con clic para ordenar */}
                <th 
                  style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }} 
                  onClick={toggleOrden}
                >
                  Nombre de la Actividad {orden === 'asc' ? '▲' : '▼'}
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '5px' }}>(clic para ordenar)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {actividadesOrdenadas.length > 0 ? (
                actividadesOrdenadas.map((item) => (
                  <tr key={item.codigo} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.15s' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#3b82f6', fontSize: '14px' }}>
                      {item.codigo}
                    </td>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>
                      {item.nombre}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
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