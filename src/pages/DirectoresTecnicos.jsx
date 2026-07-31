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

const DirectoresTecnicos = () => {
  // Estados para datos
  const [tiposDT, setTiposDT] = useState([]);
  const [directores, setDirectores] = useState([]);
  const [clientesTotales, setClientesTotales] = useState([]); // Lista para poder asignar
  
  // Estados de UI
  const [vistaActual, setVistaActual] = useState('tipos'); // 'tipos', 'todos', 'filtrados', 'form-tipo', 'form-dt', 'clientes-dt'
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [dtSeleccionado, setDtSeleccionado] = useState(null); // DT que se está viendo en "Ver Clientes"
  const [cargando, setCargando] = useState(false);
  
  // Estados para la vista de Clientes del DT
  const [clientesAsignados, setClientesAsignados] = useState([]);
  const [nuevoClienteId, setNuevoClienteId] = useState('');

  // Filtros, Ordenamiento y Paginación
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroProfesion, setFiltroProfesion] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Estados para Exportación
  const [modalExportar, setModalExportar] = useState(false);
  const [tiposExportar, setTiposExportar] = useState([]);

  // Estados para formularios
  const [editandoTipoId, setEditandoTipoId] = useState(null);
  const [formTipo, setFormTipo] = useState({ tipo: '', descripcion_tipo: '' });
  
  const [editandoDTId, setEditandoDTId] = useState(null);
  const [formDT, setFormDT] = useState({
    nombre_director: '', apellido_director: '', cuit: '', profesion: '',
    matricula: '', mail: '', fecha_vencimiento: '', id_tipo: '', usuario: ''
  });

  // Carga inicial de datos
  useEffect(() => {
    cargarDatos();
  }, []);

  // Resetear la paginación y el ordenamiento si se cambia de vista
  useEffect(() => {
    setPaginaActual(1);
    setSortConfig({ key: 'id', direction: 'asc' });
  }, [vistaActual]);

  // Resetear la paginación si se cambia un filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto, filtroProfesion]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: dataTipos, error: errTipos } = await supabase.from('tipo_director').select('*').order('id');
      if (errTipos) throw errTipos;
      setTiposDT(dataTipos || []);

      const { data: dataDT, error: errDT } = await supabase.from('director_tecnico').select('*, tipo_director(tipo)').order('id', { ascending: false });
      if (errDT) throw errDT;
      setDirectores(dataDT || []);

      // Cargar lista de clientes para poder asignarlos
      const { data: dataClientes } = await supabase.from('clientes').select('id, razon_social, cuit').order('razon_social');
      if (dataClientes) setClientesTotales(dataClientes);

    } catch (error) {
      console.error("Error cargando datos:", error.message);
    } finally {
      setCargando(false);
    }
  };

  const profesionesUnicas = [...new Set(directores.map(d => d.profesion).filter(Boolean))].sort();

  // --- NAVEGACIÓN Y VISTAS ---
  
  const verDirectoresPorTipo = (tipo) => {
    setTipoSeleccionado(tipo);
    setFiltroTexto('');
    setFiltroProfesion('');
    setVistaActual('filtrados');
  };

  const mostrarTodos = () => {
    setTipoSeleccionado(null);
    setFiltroTexto('');
    setFiltroProfesion('');
    setVistaActual('todos');
  };

  const volverATipos = () => {
    setTipoSeleccionado(null);
    setFiltroTexto('');
    setFiltroProfesion('');
    setVistaActual('tipos');
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
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'nombre_completo') {
        valA = `${a.nombre_director || ''} ${a.apellido_director || ''}`.trim();
        valB = `${b.nombre_director || ''} ${b.apellido_director || ''}`.trim();
      } else if (sortConfig.key === 'tipo_director') {
        valA = a.tipo_director?.tipo || '';
        valB = b.tipo_director?.tipo || '';
      }

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

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

  // --- LÓGICA DE CLIENTES POR DT ---
  const verClientesDeDT = async (dt) => {
    setDtSeleccionado(dt);
    setVistaActual('clientes-dt');
    setNuevoClienteId('');
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('director_cliente')
        .select('id, id_cliente, clientes(razon_social, cuit)')
        .eq('id_director', dt.id);
      if (error) throw error;
      setClientesAsignados(data || []);
    } catch (err) {
      console.error("Error al cargar clientes del DT", err);
    } finally {
      setCargando(false);
    }
  };

  const asignarClienteADT = async () => {
    if (!nuevoClienteId) return;
    try {
      const { data, error } = await supabase
        .from('director_cliente')
        .insert([{ id_director: dtSeleccionado.id, id_cliente: nuevoClienteId }])
        .select('id, id_cliente, clientes(razon_social, cuit)');
        
      if (error) throw error;
      setClientesAsignados([...clientesAsignados, data[0]]);
      setNuevoClienteId('');
    } catch (error) {
      alert("Error al asignar el cliente. Es posible que ya esté asignado.");
      console.error(error);
    }
  };

  const desvincularCliente = async (idRelacion) => {
    if(window.confirm('¿Seguro que querés desvincular este cliente del Director Técnico?')) {
      const { error } = await supabase.from('director_cliente').delete().eq('id', idRelacion);
      if(!error) {
        setClientesAsignados(clientesAsignados.filter(c => c.id !== idRelacion));
      } else {
        alert("Error al desvincular.");
      }
    }
  };

  // --- LÓGICA DE EXPORTACIÓN A EXCEL ---
  const abrirModalExportar = () => {
    setTiposExportar(tiposDT.map(t => t.id));
    setModalExportar(true);
  };

  const toggleTipoExportar = (id) => {
    setTiposExportar(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const generarExcel = async () => {
    if (tiposExportar.length === 0) {
      alert("Debes seleccionar al menos un Tipo de Director para exportar.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema CIFAS';
    const sheet = workbook.addWorksheet('Directores Técnicos');

    sheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'CUIT', key: 'cuit', width: 15 },
      { header: 'Profesión', key: 'profesion', width: 25 },
      { header: 'Matrícula', key: 'matricula', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Vencimiento', key: 'vencimiento', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 25 },
      { header: 'Usuario Asociado', key: 'usuario', width: 25 }
    ];

    const headerRow = sheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = HEADER_FONT;
      cell.fill = HEADER_FILL;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const dtsAExportar = directores.filter(d => tiposExportar.includes(d.id_tipo));

    dtsAExportar.forEach((dt, index) => {
      const row = sheet.addRow({
        nombre: dt.nombre_director,
        apellido: dt.apellido_director,
        cuit: dt.cuit || '-',
        profesion: dt.profesion || '-',
        matricula: dt.matricula || '-',
        email: dt.mail || '-',
        vencimiento: dt.fecha_vencimiento ? new Date(dt.fecha_vencimiento).toLocaleDateString('es-AR') : '-',
        tipo: dt.tipo_director?.tipo || 'Sin asignar',
        usuario: dt.usuario || '-'
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
    sheet.autoFilter = `A1:I${dtsAExportar.length + 1}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    anchor.download = `Directores_Tecnicos_${fechaArchivo}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    
    setModalExportar(false);
  };

  // --- MANEJO DE FORMULARIOS: TIPOS ---
  const iniciarNuevoTipo = () => {
    setEditandoTipoId('nuevo');
    setFormTipo({ tipo: '', descripcion_tipo: '' });
    setVistaActual('form-tipo');
  };

  const iniciarEditarTipo = (tipo) => {
    setEditandoTipoId(tipo.id);
    setFormTipo({ tipo: tipo.tipo || '', descripcion_tipo: tipo.descripcion_tipo || '' });
    setVistaActual('form-tipo');
  };

  const eliminarTipo = async (id) => {
    if (window.confirm('¿Seguro querés eliminar este Tipo de Director? Se desvincularán los directores asociados.')) {
      const { error } = await supabase.from('tipo_director').delete().eq('id', id);
      if (!error) setTiposDT(tiposDT.filter(t => t.id !== id));
    }
  };

  const guardarTipo = async (e) => {
    e.preventDefault();
    if (editandoTipoId === 'nuevo') {
      const { data, error } = await supabase.from('tipo_director').insert([formTipo]).select();
      if (!error && data) setTiposDT([...tiposDT, data[0]]);
    } else {
      const { error } = await supabase.from('tipo_director').update(formTipo).eq('id', editandoTipoId);
      if (!error) setTiposDT(tiposDT.map(t => t.id === editandoTipoId ? { ...t, ...formTipo } : t));
    }
    setVistaActual('tipos');
  };

  // --- MANEJO DE FORMULARIOS: DIRECTORES TÉCNICOS ---
  const iniciarNuevoDT = () => {
    setEditandoDTId('nuevo');
    setFormDT({
      nombre_director: '', apellido_director: '', cuit: '', profesion: '',
      matricula: '', mail: '', fecha_vencimiento: '', 
      id_tipo: tipoSeleccionado ? tipoSeleccionado.id : '', usuario: ''
    });
    setVistaActual('form-dt');
  };

  const iniciarEditarDT = (dt) => {
    setEditandoDTId(dt.id);
    setFormDT({
      nombre_director: dt.nombre_director || '',
      apellido_director: dt.apellido_director || '',
      cuit: dt.cuit || '',
      profesion: dt.profesion || '',
      matricula: dt.matricula || '',
      mail: dt.mail || '',
      fecha_vencimiento: dt.fecha_vencimiento || '',
      id_tipo: dt.id_tipo || '',
      usuario: dt.usuario || ''
    });
    setVistaActual('form-dt');
  };

  const eliminarDT = async (id) => {
    if (window.confirm('¿Seguro querés eliminar este Director Técnico?')) {
      const { error } = await supabase.from('director_tecnico').delete().eq('id', id);
      if (!error) setDirectores(directores.filter(d => d.id !== id));
    }
  };

  const guardarDT = async (e) => {
    e.preventDefault();
    const payload = { ...formDT, fecha_vencimiento: formDT.fecha_vencimiento || null, id_tipo: formDT.id_tipo || null };

    if (editandoDTId === 'nuevo') {
      const { data, error } = await supabase.from('director_tecnico').insert([payload]).select('*, tipo_director(tipo)');
      if (!error && data) setDirectores([data[0], ...directores]);
    } else {
      const { data, error } = await supabase.from('director_tecnico').update(payload).eq('id', editandoDTId).select('*, tipo_director(tipo)');
      if (!error && data) setDirectores(directores.map(d => d.id === editandoDTId ? data[0] : d));
    }
    
    if (tipoSeleccionado) setVistaActual('filtrados');
    else setVistaActual('todos');
  };

  // --- RENDERIZADO CONDICIONAL ---

  const renderModalExportar = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="cifas-card" style={{ width: '450px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>Exportar a Excel</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Seleccioná los Tipos de DT que deseás incluir en el reporte:</p>
        
        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '12px' }}>
          {tiposDT.map(tipo => (
            <label key={tipo.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={tiposExportar.includes(tipo.id)}
                onChange={() => toggleTipoExportar(tipo.id)}
              />
              <span style={{ fontSize: '14px', color: '#334155' }}>{tipo.tipo}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={() => setTiposExportar(tiposDT.map(t => t.id))} className="cifas-btn cifas-btn--secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>Todos</button>
             <button onClick={() => setTiposExportar([])} className="cifas-btn cifas-btn--secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>Ninguno</button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setModalExportar(false)} className="cifas-btn cifas-btn--secondary">Cancelar</button>
            <button onClick={generarExcel} className="cifas-btn cifas-btn--primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>Descargar Excel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderListadoTipos = () => {
    const tiposAMostrar = ordenarDatos(tiposDT);

    return (
      <div className="cifas-card">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p className="cifas-card__titulo">Módulo Contactos</p>
            <h2 className="cifas-card__main-name">Tipos de Directores Técnicos</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={mostrarTodos} className="cifas-btn cifas-btn--secondary">
              Mostrar Todos los DTs
            </button>
            <button onClick={abrirModalExportar} className="cifas-btn cifas-btn--secondary" style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }}>
              Exportar Excel
            </button>
            <button onClick={iniciarNuevoTipo} className="cifas-btn cifas-btn--primary">
              + Crear Tipo
            </button>
          </div>
        </header>

        <div className="cifas-table-wrap">
          <table className="cifas-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('id')} style={{ cursor: 'pointer' }}>ID {getSortIcon('id')}</th>
                <th onClick={() => requestSort('tipo')} style={{ cursor: 'pointer' }}>Tipo {getSortIcon('tipo')}</th>
                <th onClick={() => requestSort('descripcion_tipo')} style={{ cursor: 'pointer' }}>Descripción {getSortIcon('descripcion_tipo')}</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tiposAMostrar.map((tipo) => (
                <tr key={tipo.id}>
                  <td style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{tipo.id}</td>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>{tipo.tipo}</td>
                  <td style={{ color: '#475569' }}>{tipo.descripcion_tipo}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => verDirectoresPorTipo(tipo)} className="cifas-btn cifas-btn--primary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                      Ver Directores
                    </button>
                    <button onClick={() => iniciarEditarTipo(tipo)} className="cifas-btn cifas-btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                      Editar
                    </button>
                    <button onClick={() => eliminarTipo(tipo.id)} className="cifas-btn cifas-btn--pdf" style={{ padding: '6px 12px', fontSize: '11px' }}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {tiposAMostrar.length === 0 && !cargando && (
                <tr><td colSpan="4" className="cifas-table-empty">No hay Tipos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderListadoDirectores = () => {
    let dtsAMostrar = vistaActual === 'filtrados' ? directores.filter(d => d.id_tipo === tipoSeleccionado?.id) : directores;

    if (filtroTexto) {
      const search = filtroTexto.toLowerCase();
      dtsAMostrar = dtsAMostrar.filter(d => 
        (d.nombre_director || '').toLowerCase().includes(search) || 
        (d.apellido_director || '').toLowerCase().includes(search) ||
        (d.cuit || '').includes(search)
      );
    }
    
    if (filtroProfesion) dtsAMostrar = dtsAMostrar.filter(d => d.profesion === filtroProfesion);

    dtsAMostrar = ordenarDatos(dtsAMostrar);

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const dtsPaginados = dtsAMostrar.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(dtsAMostrar.length / itemsPorPagina);

    return (
      <div className="cifas-card">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p className="cifas-card__titulo">
              {vistaActual === 'filtrados' ? `Directores del tipo: ${tipoSeleccionado?.tipo}` : 'Todos los Directores Técnicos'}
            </p>
            <h2 className="cifas-card__main-name">Directores Técnicos</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={abrirModalExportar} className="cifas-btn cifas-btn--secondary" style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }}>
              Exportar Excel
            </button>
            <button onClick={volverATipos} className="cifas-btn cifas-btn--secondary">
              ← Volver a Tipos
            </button>
            <button onClick={iniciarNuevoDT} className="cifas-btn cifas-btn--primary">
              + Crear DT
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <input 
              type="text" 
              placeholder="Buscar por Nombre, Apellido o CUIT..." 
              className="cifas-input" 
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{ margin: 0, backgroundColor: '#fff' }}
            />
          </div>
          <div style={{ width: '250px' }}>
            <select 
              className="cifas-select" 
              value={filtroProfesion}
              onChange={(e) => setFiltroProfesion(e.target.value)}
              style={{ margin: 0, backgroundColor: '#fff' }}
            >
              <option value="">Todas las Profesiones</option>
              {profesionesUnicas.map(prof => (
                <option key={prof} value={prof}>{prof}</option>
              ))}
            </select>
          </div>
          {(filtroTexto || filtroProfesion) && (
            <button onClick={() => { setFiltroTexto(''); setFiltroProfesion(''); }} className="cifas-btn cifas-btn--secondary" style={{ whiteSpace: 'nowrap' }}>
              Limpiar Filtros
            </button>
          )}
        </div>

        {dtsAMostrar.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
            <span>Mostrando {indicePrimerItem + 1} a {Math.min(indiceUltimoItem, dtsAMostrar.length)} de {dtsAMostrar.length} directores</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="cifas-btn cifas-btn--secondary" style={{ padding: '4px 12px' }}>Anterior</button>
              <span style={{ padding: '4px 8px', fontWeight: 'bold', color: '#0f172a' }}>{paginaActual} / {totalPaginas}</span>
              <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="cifas-btn cifas-btn--secondary" style={{ padding: '4px 12px' }}>Siguiente</button>
            </div>
          </div>
        )}

        <div className="cifas-table-wrap">
          <table className="cifas-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('nombre_completo')} style={{ cursor: 'pointer' }}>Nombre Completo {getSortIcon('nombre_completo')}</th>
                <th onClick={() => requestSort('cuit')} style={{ cursor: 'pointer' }}>CUIT {getSortIcon('cuit')}</th>
                <th onClick={() => requestSort('profesion')} style={{ cursor: 'pointer' }}>Profesión {getSortIcon('profesion')}</th>
                <th onClick={() => requestSort('mail')} style={{ cursor: 'pointer' }}>Email {getSortIcon('mail')}</th>
                <th onClick={() => requestSort('fecha_vencimiento')} style={{ cursor: 'pointer' }}>Vencimiento {getSortIcon('fecha_vencimiento')}</th>
                {vistaActual === 'todos' && (
                  <th onClick={() => requestSort('tipo_director')} style={{ cursor: 'pointer' }}>Tipo {getSortIcon('tipo_director')}</th>
                )}
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dtsPaginados.map((dt) => (
                <tr key={dt.id}>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>
                    {dt.nombre_director} {dt.apellido_director}
                  </td>
                  <td>{dt.cuit || '-'}</td>
                  <td>{dt.profesion || '-'}</td>
                  <td>{dt.mail || '-'}</td>
                  <td>
                    {dt.fecha_vencimiento ? new Date(dt.fecha_vencimiento).toLocaleDateString('es-AR') : '-'}
                  </td>
                  {vistaActual === 'todos' && (
                    <td>
                      <span className="cifas-chip" style={{ background: '#eff6ff', color: '#2563eb', fontSize: '10px' }}>
                        {dt.tipo_director?.tipo || 'Sin asignar'}
                      </span>
                    </td>
                  )}
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => verClientesDeDT(dt)} className="cifas-btn cifas-btn--primary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                      Ver Clientes
                    </button>
                    <button onClick={() => iniciarEditarDT(dt)} className="cifas-btn cifas-btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                      Editar
                    </button>
                    <button onClick={() => eliminarDT(dt.id)} className="cifas-btn cifas-btn--pdf" style={{ padding: '6px 12px', fontSize: '11px' }}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {dtsAMostrar.length === 0 && !cargando && (
                <tr><td colSpan={vistaActual === 'todos' ? "7" : "6"} className="cifas-table-empty">No hay directores para mostrar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- VISTA DE CLIENTES POR DIRECTOR TÉCNICO ---
  const renderClientesDeDT = () => {
    // Filtramos los clientes que ya tiene asignados para no mostrarlos en el desplegable
    const asignadosIds = clientesAsignados.map(ca => ca.id_cliente);
    const clientesDisponibles = clientesTotales.filter(c => !asignadosIds.includes(c.id));

    return (
      <div className="cifas-card">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p className="cifas-card__titulo">Clientes Asignados</p>
            <h2 className="cifas-card__main-name">DT: {dtSeleccionado?.nombre_director} {dtSeleccionado?.apellido_director}</h2>
          </div>
          <button onClick={() => setVistaActual(tipoSeleccionado ? 'filtrados' : 'todos')} className="cifas-btn cifas-btn--secondary">
            ← Volver a Directores
          </button>
        </header>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'flex-end' }}>
          <label className="cifas-field" style={{ flex: 1, margin: 0 }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Asignar nuevo cliente a este Director Técnico:</span>
            <select 
              value={nuevoClienteId} 
              onChange={(e) => setNuevoClienteId(e.target.value)} 
              className="cifas-select" 
              style={{ backgroundColor: '#fff', margin: 0 }}
            >
              <option value="">-- Seleccionar Cliente --</option>
              {clientesDisponibles.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social} (CUIT: {c.cuit || 'S/N'})</option>
              ))}
            </select>
          </label>
          <button 
            onClick={asignarClienteADT} 
            disabled={!nuevoClienteId}
            className="cifas-btn cifas-btn--primary"
            style={{ height: '38px', whiteSpace: 'nowrap' }}
          >
            + Asignar Cliente
          </button>
        </div>

        <div className="cifas-table-wrap">
          <table className="cifas-table">
            <thead>
              <tr>
                <th>Razón Social del Cliente</th>
                <th>CUIT</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesAsignados.map((relacion) => (
                <tr key={relacion.id}>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>
                    {relacion.clientes?.razon_social}
                  </td>
                  <td>{relacion.clientes?.cuit || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => desvincularCliente(relacion.id)} className="cifas-btn cifas-btn--pdf" style={{ padding: '6px 12px', fontSize: '11px' }}>
                      Desvincular
                    </button>
                  </td>
                </tr>
              ))}
              {clientesAsignados.length === 0 && !cargando && (
                <tr><td colSpan="3" className="cifas-table-empty">Este Director Técnico no tiene clientes asignados actualmente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFormTipo = () => (
    <div className="cifas-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h2 className="cifas-card__main-name" style={{ fontSize: '20px', color: '#1e3a8a' }}>
            {editandoTipoId === 'nuevo' ? 'Nuevo Tipo de DT' : 'Editar Tipo de DT'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={volverATipos} className="cifas-btn cifas-btn--secondary">← Cancelar</button>
          <button type="submit" form="form-tipo" className="cifas-btn cifas-btn--primary">Guardar</button>
        </div>
      </header>

      <form id="form-tipo" onSubmit={guardarTipo}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <label className="cifas-field">
            <span>Nombre del Tipo</span>
            <input type="text" value={formTipo.tipo} onChange={(e) => setFormTipo({...formTipo, tipo: e.target.value})} required className="cifas-input" />
          </label>
          <label className="cifas-field">
            <span>Descripción</span>
            <input type="text" value={formTipo.descripcion_tipo} onChange={(e) => setFormTipo({...formTipo, descripcion_tipo: e.target.value})} className="cifas-input" />
          </label>
        </div>
      </form>
    </div>
  );

  const renderFormDT = () => (
    <div className="cifas-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h2 className="cifas-card__main-name" style={{ fontSize: '20px', color: '#1e3a8a' }}>
            {editandoDTId === 'nuevo' ? 'Nuevo Director Técnico' : 'Editar Director Técnico'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => setVistaActual(tipoSeleccionado ? 'filtrados' : 'todos')} className="cifas-btn cifas-btn--secondary">← Cancelar</button>
          <button type="submit" form="form-dt" className="cifas-btn cifas-btn--primary">Guardar</button>
        </div>
      </header>

      <form id="form-dt" onSubmit={guardarDT}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <label className="cifas-field">
            <span>Nombre</span>
            <input type="text" value={formDT.nombre_director} onChange={(e) => setFormDT({...formDT, nombre_director: e.target.value})} required className="cifas-input" />
          </label>
          <label className="cifas-field">
            <span>Apellido</span>
            <input type="text" value={formDT.apellido_director} onChange={(e) => setFormDT({...formDT, apellido_director: e.target.value})} required className="cifas-input" />
          </label>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <label className="cifas-field">
            <span>CUIT</span>
            <input type="text" value={formDT.cuit} onChange={(e) => setFormDT({...formDT, cuit: e.target.value})} className="cifas-input" />
          </label>
          <label className="cifas-field">
            <span>Profesión</span>
            <input type="text" value={formDT.profesion} onChange={(e) => setFormDT({...formDT, profesion: e.target.value})} className="cifas-input" />
          </label>
          <label className="cifas-field">
            <span>Matrícula</span>
            <input type="text" value={formDT.matricula} onChange={(e) => setFormDT({...formDT, matricula: e.target.value})} className="cifas-input" />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <label className="cifas-field">
            <span>Email</span>
            <input type="email" value={formDT.mail} onChange={(e) => setFormDT({...formDT, mail: e.target.value})} className="cifas-input" />
          </label>
          <label className="cifas-field">
            <span>Fecha de Vencimiento</span>
            <input type="date" value={formDT.fecha_vencimiento} onChange={(e) => setFormDT({...formDT, fecha_vencimiento: e.target.value})} className="cifas-input" />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <label className="cifas-field">
            <span>Tipo de DT</span>
            <select value={formDT.id_tipo} onChange={(e) => setFormDT({...formDT, id_tipo: e.target.value})} className="cifas-select">
              <option value="">-- Seleccionar Tipo --</option>
              {tiposDT.map(t => (
                <option key={t.id} value={t.id}>{t.tipo}</option>
              ))}
            </select>
          </label>
          <label className="cifas-field">
            <span>Usuario (Agente asociado)</span>
            <input type="text" value={formDT.usuario} onChange={(e) => setFormDT({...formDT, usuario: e.target.value})} className="cifas-input" />
          </label>
        </div>
      </form>
    </div>
  );

  return (
    <>
      {modalExportar && renderModalExportar()}
      {vistaActual === 'tipos' && renderListadoTipos()}
      {(vistaActual === 'todos' || vistaActual === 'filtrados') && renderListadoDirectores()}
      {vistaActual === 'clientes-dt' && renderClientesDeDT()}
      {vistaActual === 'form-tipo' && renderFormTipo()}
      {vistaActual === 'form-dt' && renderFormDT()}
    </>
  );
};

export default DirectoresTecnicos;