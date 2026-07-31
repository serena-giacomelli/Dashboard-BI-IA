import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { supabase } from '../utils/supabase';
import '../styles/Global.css';

// --- ESTILOS PARA EL EXCEL ---
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
const HEADER_FONT = { bold: true, size: 11, color: { argb: 'FF16324F' } };
const THIN_BORDER = {
  top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
};
const ALT_ROW_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };

// --- FUNCIÓN HELPER PARA CAPITALIZAR (Title Case) ---
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const OrganismosRegionales = () => {
  // Estados para datos
  const [contactos, setContactos] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Estados de UI
  const [vistaActual, setVistaActual] = useState('listado'); // 'listado', 'formulario'
  const [editandoId, setEditandoId] = useState(null);
  
  // Filtros, Ordenamiento y Paginación
  const [filtroTexto, setFiltroTexto] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Estado del formulario
  const [formData, setFormData] = useState({
    organismo: '',
    regional: '',
    area_oficina: '',
    nombre_apellido: '',
    telefono: '',
    email: ''
  });

  // Carga inicial de datos
  useEffect(() => {
    cargarDatos();
  }, []);

  // Resetear la paginación si se cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase.from('organismos_regionales').select('*').order('id');
      if (error) throw error;
      setContactos(data || []);
    } catch (error) {
      console.error("Error cargando datos:", error.message);
    } finally {
      setCargando(false);
    }
  };

  // --- LÓGICA DE ORDENAMIENTO ---
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (colName) => {
    if (sortConfig.key !== colName) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '4px', color: '#2563eb' }}>▲</span> : <span style={{ marginLeft: '4px', color: '#2563eb' }}>▼</span>;
  };

  const ordenarDatos = (datos) => {
    if (!sortConfig.key) return datos;
    return [...datos].sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // --- LÓGICA DE EXPORTACIÓN A EXCEL ---
  const generarExcel = async (datosExportar) => {
    if (datosExportar.length === 0) {
      alert("No hay datos para exportar con los filtros actuales.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema CIFAS';
    const sheet = workbook.addWorksheet('Organismos y Regionales');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Organismo', key: 'organismo', width: 30 },
      { header: 'Regional', key: 'regional', width: 25 },
      { header: 'Área u Oficina', key: 'area_oficina', width: 30 },
      { header: 'Nombre y Apellido', key: 'nombre_apellido', width: 30 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Email', key: 'email', width: 30 }
    ];

    const headerRow = sheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = HEADER_FONT;
      cell.fill = HEADER_FILL;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    datosExportar.forEach((contacto, index) => {
      const row = sheet.addRow({
        id: contacto.id,
        organismo: contacto.organismo,
        regional: contacto.regional || '-',
        area_oficina: contacto.area_oficina || '-',
        nombre_apellido: contacto.nombre_apellido || '-',
        telefono: contacto.telefono || '-',
        email: contacto.email || '-'
      });
      row.height = 22;
      
      const isAlt = index % 2 === 1;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = THIN_BORDER;
        cell.font = { size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        if (isAlt) cell.fill = ALT_ROW_FILL;
      });
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = `A1:G${datosExportar.length + 1}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    anchor.download = `Organismos_Regionales_${fechaArchivo}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  // --- MANEJO DE FORMULARIOS ---

  const iniciarNuevo = () => {
    setEditandoId('nuevo');
    setFormData({
      organismo: '', regional: '', area_oficina: '',
      nombre_apellido: '', telefono: '', email: ''
    });
    setVistaActual('formulario');
  };

  const iniciarEditar = (contacto) => {
    setEditandoId(contacto.id);
    setFormData({
      organismo: contacto.organismo || '',
      regional: contacto.regional || '',
      area_oficina: contacto.area_oficina || '',
      nombre_apellido: contacto.nombre_apellido || '',
      telefono: contacto.telefono || '',
      email: contacto.email || ''
    });
    setVistaActual('formulario');
  };

  const eliminarContacto = async (id) => {
    if (window.confirm('¿Seguro querés eliminar este registro?')) {
      const { error } = await supabase.from('organismos_regionales').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
      }
      setContactos(contactos.filter(c => c.id !== id));
    }
  };

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplicar las reglas de formato según el campo
    if (name === 'organismo') {
      formattedValue = value.toUpperCase(); // Todo en MAYÚSCULAS
    } else if (name === 'regional' || name === 'area_oficina' || name === 'nombre_apellido') {
      formattedValue = toTitleCase(value); // Primera Letra En Mayúscula
    }
    // telefono y email quedan tal cual (email suele ir en minúscula naturalmente)

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const guardarContacto = async (e) => {
    e.preventDefault();
    if (editandoId === 'nuevo') {
      const { data, error } = await supabase.from('organismos_regionales').insert([formData]).select();
      if (!error && data) setContactos([...contactos, data[0]]);
    } else {
      const { error } = await supabase.from('organismos_regionales').update(formData).eq('id', editandoId);
      if (!error) setContactos(contactos.map(c => c.id === editandoId ? { ...c, ...formData } : c));
    }
    setVistaActual('listado');
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (vistaActual === 'formulario') {
    return (
      <div className="cifas-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div>
            <p className="cifas-card__titulo">Módulo Contactos</p>
            <h2 className="cifas-card__main-name" style={{ fontSize: '20px', color: '#1e3a8a' }}>
              {editandoId === 'nuevo' ? 'Nuevo Contacto de Organismo' : 'Editar Contacto'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => setVistaActual('listado')} className="cifas-btn cifas-btn--secondary">← Cancelar</button>
            <button type="submit" form="form-contacto" className="cifas-btn cifas-btn--primary">Guardar</button>
          </div>
        </header>

        <form id="form-contacto" onSubmit={guardarContacto}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <label className="cifas-field">
              <span>Organismo</span>
              <input type="text" name="organismo" value={formData.organismo} onChange={manejarCambioInput} required className="cifas-input" placeholder="Ej: SENASA" />
            </label>
            <label className="cifas-field">
              <span>Regional</span>
              <input type="text" name="regional" value={formData.regional} onChange={manejarCambioInput} className="cifas-input" placeholder="Ej: Santa Fe" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <label className="cifas-field">
              <span>Área u Oficina</span>
              <input type="text" name="area_oficina" value={formData.area_oficina} onChange={manejarCambioInput} className="cifas-input" />
            </label>
            <label className="cifas-field">
              <span>Nombre y Apellido</span>
              <input type="text" name="nombre_apellido" value={formData.nombre_apellido} onChange={manejarCambioInput} className="cifas-input" />
            </label>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label className="cifas-field">
              <span>Teléfono</span>
              <input type="text" name="telefono" value={formData.telefono} onChange={manejarCambioInput} className="cifas-input" />
            </label>
            <label className="cifas-field">
              <span>Email</span>
              <input type="email" name="email" value={formData.email} onChange={manejarCambioInput} className="cifas-input" />
            </label>
          </div>
        </form>
      </div>
    );
  }

  // VISTA LISTADO
  // 1. Filtrar
  let contactosAMostrar = contactos;
  if (filtroTexto) {
    const search = filtroTexto.toLowerCase();
    contactosAMostrar = contactosAMostrar.filter(c => 
      (c.organismo || '').toLowerCase().includes(search) || 
      (c.regional || '').toLowerCase().includes(search) ||
      (c.nombre_apellido || '').toLowerCase().includes(search) ||
      (c.area_oficina || '').toLowerCase().includes(search)
    );
  }

  // 2. Ordenar
  contactosAMostrar = ordenarDatos(contactosAMostrar);

  // 3. Paginar
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const contactosPaginados = contactosAMostrar.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(contactosAMostrar.length / itemsPorPagina);

  return (
    <div className="cifas-card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="cifas-card__titulo">Módulo Contactos</p>
          <h2 className="cifas-card__main-name">Organismos y Regionales</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => generarExcel(contactosAMostrar)} className="cifas-btn cifas-btn--secondary" style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }}>
            Exportar Excel
          </button>
          <button onClick={iniciarNuevo} className="cifas-btn cifas-btn--primary">
            + Nuevo Contacto
          </button>
        </div>
      </header>

      {/* BARRA DE BÚSQUEDA */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <input 
            type="text" 
            placeholder="Buscar por Organismo, Regional, Área o Nombre..." 
            className="cifas-input" 
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            style={{ margin: 0, backgroundColor: '#fff' }}
          />
        </div>
        {filtroTexto && (
          <button onClick={() => setFiltroTexto('')} className="cifas-btn cifas-btn--secondary">
            Limpiar Filtro
          </button>
        )}
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {contactosAMostrar.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
          <span>
            Mostrando {indicePrimerItem + 1} a {Math.min(indiceUltimoItem, contactosAMostrar.length)} de {contactosAMostrar.length} contactos
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))} 
              disabled={paginaActual === 1}
              className="cifas-btn cifas-btn--secondary" style={{ padding: '4px 12px' }}>Anterior</button>
            <span style={{ padding: '4px 8px', fontWeight: 'bold', color: '#0f172a' }}>{paginaActual} / {totalPaginas}</span>
            <button 
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} 
              disabled={paginaActual === totalPaginas}
              className="cifas-btn cifas-btn--secondary" style={{ padding: '4px 12px' }}>Siguiente</button>
          </div>
        </div>
      )}

      {/* TABLA PAGINADA */}
      <div className="cifas-table-wrap">
        <table className="cifas-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('organismo')} style={{ cursor: 'pointer' }}>Organismo {getSortIcon('organismo')}</th>
              <th onClick={() => requestSort('regional')} style={{ cursor: 'pointer' }}>Regional {getSortIcon('regional')}</th>
              <th onClick={() => requestSort('area_oficina')} style={{ cursor: 'pointer' }}>Área u Oficina {getSortIcon('area_oficina')}</th>
              <th onClick={() => requestSort('nombre_apellido')} style={{ cursor: 'pointer' }}>Nombre y Apellido {getSortIcon('nombre_apellido')}</th>
              <th>Teléfono</th>
              <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>Email {getSortIcon('email')}</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contactosPaginados.map((contacto) => (
              <tr key={contacto.id}>
                <td style={{ fontWeight: '600', color: '#1e293b' }}>{contacto.organismo}</td>
                <td>{contacto.regional || '-'}</td>
                <td>{contacto.area_oficina || '-'}</td>
                <td>{contacto.nombre_apellido || '-'}</td>
                <td>{contacto.telefono || '-'}</td>
                <td>{contacto.email || '-'}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => iniciarEditar(contacto)} className="cifas-btn cifas-btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                    Editar
                  </button>
                  <button onClick={() => eliminarContacto(contacto.id)} className="cifas-btn cifas-btn--pdf" style={{ padding: '6px 12px', fontSize: '11px' }}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {contactosAMostrar.length === 0 && !cargando && (
              <tr><td colSpan="7" className="cifas-table-empty">No hay contactos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrganismosRegionales;