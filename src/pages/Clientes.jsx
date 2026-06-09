// src/pages/Clientes.jsx
import { useState } from 'react';

// Recibimos clientes y setClientes como props desde App.jsx
const Clientes = ({ clientes, setClientes }) => {
  const [clienteEditando, setClienteEditando] = useState(null);
  const [formData, setFormData] = useState(null);

  // Abrir modal de edición
  const manejarEdicion = (cliente) => {
    setClienteEditando(cliente.id);
    setFormData({ ...cliente });
  };

  // Manejar cambios en los inputs del formulario
  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Guardar los cambios simulados
  const guardarCambios = (e) => {
    e.preventDefault();
    // Actualizamos el estado global que viene de App.jsx
    setClientes(clientes.map(c => c.id === formData.id ? formData : c));
    setClienteEditando(null);
    setFormData(null);
    alert(`✅ Datos de ${formData.razonSocial} actualizados correctamente.`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Directorio de Clientes</h2>
        <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
          Gestión integral de cuentas, condiciones fiscales y preferencias de comunicación.
        </p>
      </div>

      {/* Tabla Principal de Clientes */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Razón Social</th>
                <th style={{ padding: '12px' }}>CUIT</th>
                <th style={{ padding: '12px' }}>Tipo Cliente</th>
                <th style={{ padding: '12px' }}>Boletín Manual</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Saldo</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{cliente.razonSocial}</td>
                  <td style={{ padding: '12px' }}>{cliente.cuit}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '11px', fontWeight: 'bold' }}>
                      {cliente.tipoCliente}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '16px' }}>
                    {cliente.enviarBoletin ? "☑" : "☐"}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: cliente.saldo < 0 ? '#dc2626' : '#16a34a' }}>
                    ${cliente.saldo.toLocaleString('es-AR')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => manejarEdicion(cliente)}
                      style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      Editar Ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
      {clienteEditando && formData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Editando Cliente: {formData.razonSocial}</h3>
              <button onClick={() => setClienteEditando(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✖</button>
            </div>

            <form onSubmit={guardarCambios}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Razón Social</label>
                  <input type="text" name="razonSocial" value={formData.razonSocial} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>CUIT</label>
                  <input type="text" name="cuit" value={formData.cuit} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tipo Cliente</label>
                  <select name="tipoCliente" value={formData.tipoCliente} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="POTENCIAL">POTENCIAL</option>
                    <option value="CIFAS">CIFAS</option>
                    <option value="CIFAS-mensual">CIFAS-mensual</option>
                    <option value="CUIT INHABILITADO">CUIT INHABILITADO</option>
                    <option value="CONTACTOS">CONTACTOS</option>
                    <option value="SIN ACTIVIDAD">SIN ACTIVIDAD</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Condición Fiscal</label>
                  <select name="condicionFiscal" value={formData.condicionFiscal} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="RESP INSCRIPTO">RESP INSCRIPTO</option>
                    <option value="RESP NO INSCRIPTO">RESP NO INSCRIPTO</option>
                    <option value="EXENTO">EXENTO</option>
                    <option value="CONSUMIDOR FINAL">CONSUMIDOR FINAL</option>
                    <option value="MONOTRIBUTISTA">MONOTRIBUTISTA</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Mail Facturación Primario</label>
                  <input type="email" name="mailFacturacionPrimario" value={formData.mailFacturacionPrimario} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Mail Facturación Secundario</label>
                  <input type="email" name="mailFacturacionSecundario" value={formData.mailFacturacionSecundario} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>--- Domicilios y Localidades ---</label>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Dirección Administrativa</label>
                  <input type="text" name="direccionAdministrativa" value={formData.direccionAdministrativa} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Localidad Administrativa</label>
                  <input type="text" name="localidadAdmin" value={formData.localidadAdmin} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Domicilio Fiscal</label>
                  <input type="text" name="domicilioFiscal" value={formData.domicilioFiscal} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Localidad Fiscal</label>
                  <input type="text" name="localidadFiscal" value={formData.localidadFiscal} onChange={manejarCambio} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="enviarBoletin" name="enviarBoletin" checked={formData.enviarBoletin} onChange={manejarCambio} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                <label htmlFor="enviarBoletin" style={{ fontWeight: 'bold', color: '#166534', cursor: 'pointer' }}>Habilitar Envío de Boletines (Inclusión Manual)</label>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={() => setClienteEditando(null)} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;