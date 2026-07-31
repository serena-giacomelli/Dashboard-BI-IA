import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { supabase } from '../utils/supabase';
import '../styles/Global.css';

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
const HEADER_FONT = { bold: true, size: 11, color: { argb: 'FF16324F' } };
const THIN_BORDER = {
  top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
};
const ALT_ROW_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };

const Organismos = () => {
  const [organismos, setOrganismos] = useState([]);
  const [regionales, setRegionales] = useState([]);
  const [vistaActual, setVistaActual] = useState('organismos');
  const [orgSeleccionado, setOrgSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;
  const [modalExportar, setModalExportar] = useState(false);
  const [orgsExportar, setOrgsExportar] = useState([]);
  const [editandoOrgId, setEditandoOrgId] = useState(null);
  const [formOrg, setFormOrg] = useState({ nombre_razonsocial: '', descripcion: '' });
  const [editandoRegId, setEditandoRegId] = useState(null);
  const [formReg, setFormReg] = useState({
    nombre: '', descripcion: '', id_organismo: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
    setSortConfig({ key: 'id', direction: 'asc' });
  }, [vistaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: dataOrgs, error: errOrgs } = await supabase.from('organismo').select('*').order('id');
      if (errOrgs) throw errOrgs;
      setOrganismos(dataOrgs || []);
      const { data: dataRegs, error: errRegs } = await supabase.from('regional').select('*, organismo(nombre_razonsocial)').order('id', { ascending: false });
      if (errRegs) throw errRegs;
      setRegionales(dataRegs || []);
    } catch (error) {
      console.error("Error cargando datos:", error.message);
    } finally {
      setCargando(false);
    }
  };
  
  const verRegionalesPorOrg = (org) => {
    setOrgSeleccionado(org);
    setFiltroTexto('');
    setVistaActual('filtrados');
  };

  const mostrarTodas = () => {
    setOrgSeleccionado(null);
    setFiltroTexto('');
    setVistaActual('todos');
  };

  const volverAOrganismos = () => {
    setOrgSeleccionado(null);
    setFiltroTexto('');
    setVistaActual('organismos');
  };

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
      if (sortConfig.key === 'organismo') {
        valA = a.organismo?.nombre_razonsocial || '';
        valB = b.organismo?.nombre_razonsocial || '';
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

  const abrirModalExportar = () => {
    setOrgsExportar(organismos.map(o => o.id));
    setModalExportar(true);
  };

  const toggleOrgExportar = (id) => {
    setOrgsExportar(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );};

  const generarExcel = async () => {
    if (orgsExportar.length === 0) {
      alert("Debes seleccionar al menos un Organismo para exportar.");
      return;
    }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema CIFAS';
    const sheet = workbook.addWorksheet('Regionales');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Regional', key: 'nombre', width: 30 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Organismo Perteneciente', key: 'organismo', width: 35 }
    ];
    const headerRow = sheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = HEADER_FONT;
      cell.fill = HEADER_FILL;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const regsAExportar = regionales.filter(r => orgsExportar.includes(r.id_organismo));

    regsAExportar.forEach((reg, index) => {
      const row = sheet.addRow({
        id: reg.id,
        nombre: reg.nombre,
        descripcion: reg.descripcion || '-',
        organismo: reg.organismo?.nombre_razonsocial || 'Sin asignar'
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
    sheet.autoFilter = `A1:D${regsAExportar.length + 1}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    anchor.download = `Regionales_${fechaArchivo}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setModalExportar(false);
  };

  const iniciarNuevoOrg = () => {
    setEditandoOrgId('nuevo');
    setFormOrg({ nombre_razonsocial: '', descripcion: '' });
    setVistaActual('form-org');
  };

  const iniciarEditarOrg = (org) => {
    setEditandoOrgId(org.id);
    setFormOrg({ nombre_razonsocial: org.nombre_razonsocial || '', descripcion: org.descripcion || '' });
    setVistaActual('form-org');
  };

  const eliminarOrg = async (id) => {
    if (window.confirm('¿Seguro querés eliminar este Organismo? Se desvincularán las regionales asociadas.')) {
      const { error } = await supabase.from('organismo').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
      }
      setOrganismos(organismos.filter(o => o.id !== id));
    }};

  const guardarOrg = async (e) => {
    e.preventDefault();
    if (editandoOrgId === 'nuevo') {
      const { data, error } = await supabase.from('organismo').insert([formOrg]).select();
      if (!error && data) setOrganismos([...organismos, data[0]]);
    } else {
      const { error } = await supabase.from('organismo').update(formOrg).eq('id', editandoOrgId);
      if (!error) setOrganismos(organismos.map(o => o.id === editandoOrgId ? { ...o, ...formOrg } : o));
    }
    setVistaActual('organismos');
  };

  const iniciarNuevaReg = () => {
    setEditandoRegId('nuevo');
    setFormReg({
      nombre: '', descripcion: '',
      id_organismo: orgSeleccionado ? orgSeleccionado.id : ''
    });
    setVistaActual('form-reg');
  };

  const iniciarEditarReg = (reg) => {
    setEditandoRegId(reg.id);
    setFormReg({
      nombre: reg.nombre || '',
      descripcion: reg.descripcion || '',
      id_organismo: reg.id_organismo || ''
    });
    setVistaActual('form-reg');
  };

  const eliminarReg = async (id) => {
    if (window.confirm('¿Seguro querés eliminar esta Regional?')) {
      const { error } = await supabase.from('regional').delete().eq('id', id);
      if (!error) setRegionales(regionales.filter(r => r.id !== id));
    }
  };

  const guardarReg = async (e) => {
    e.preventDefault();
    const payload = {
      ...formReg,
      id_organismo: formReg.id_organismo || null
    };

    if (editandoRegId === 'nuevo') {
      const { data, error } = await supabase.from('regional').insert([payload]).select('*, organismo(nombre_razonsocial)');
      if (!error && data) setRegionales([data[0], ...regionales]);
    } else {
      const { data, error } = await supabase.from('regional').update(payload).eq('id', editandoRegId).select('*, organismo(nombre_razonsocial)');
      if (!error && data) setRegionales(regionales.map(r => r.id === editandoRegId ? data[0] : r));
    }
    
    if (orgSeleccionado) setVistaActual('filtrados');
    else setVistaActual('todos');
  };

  const renderModalExportar = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="cifas-card" style={{ width: '450px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>Exportar a Excel</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Seleccioná los Organismos cuyas Regionales querés exportar:</p>
        
        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '12px' }}>
          {organismos.map(org => (
            <label key={org.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={orgsExportar.includes(org.id)}
                onChange={() => toggleOrgExportar(org.id)}
              />
              <span style={{ fontSize: '14px', color: '#334155' }}>{org.nombre_razonsocial}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={() => setOrgsExportar(organismos.map(o => o.id))} className="cifas-btn cifas-btn--secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>Todos</button>
             <button onClick={() => setOrgsExportar([])} className="cifas-btn cifas-btn--secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>Ninguno</button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setModalExportar(false)} className="cifas-btn cifas-btn--secondary">Cancelar</button>
            <button onClick={generarExcel} className="cifas-btn cifas-btn--primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>Descargar Excel</button>
          </div>
        </div>
      </div>
    </div>);

  const renderListadoOrganismos = () => {
    let orgsAMostrar = organismos;
    if (filtroTexto) {
      const search = filtroTexto.toLowerCase();
      orgsAMostrar = orgsAMostrar.filter(o => 
        (o.nombre_razonsocial || '').toLowerCase().includes(search) || 
        (o.descripcion || '').toLowerCase().includes(search)
      );}

    orgsAMostrar = ordenarDatos(orgsAMostrar);

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const orgsPaginados = orgsAMostrar.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(orgsAMostrar.length / itemsPorPagina);

    return (
      <div className="cifas-card">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p className="cifas-card__titulo">Módulo Contactos</p>
            <h2 className="cifas-card__main-name">Organismos</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={mostrarTodas} className="cifas-btn cifas-btn--secondary">
              Mostrar Todas las Regionales
            </button>
            <button onClick={abrirModalExportar} className="cifas-btn cifas-btn--secondary" style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }}>
              Exportar Excel
            </button>
            <button onClick={iniciarNuevoOrg} className="cifas-btn cifas-btn--primary">
              + Crear Organismo
            </button>
          </div>
        </header>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <input 
              type="text" 
              placeholder="Buscar por Nombre o Descripción..." 
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
        {orgsAMostrar.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
            <span>
              Mostrando {indicePrimerItem + 1} a {Math.min(indiceUltimoItem, orgsAMostrar.length)} de {orgsAMostrar.length} organismos
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
        <div className="cifas-table-wrap">
          <table className="cifas-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('id')} style={{ width: '80px', cursor: 'pointer' }}>ID {getSortIcon('id')}</th>
                <th onClick={() => requestSort('nombre_razonsocial')} style={{ width: '35%', cursor: 'pointer' }}>Nombre / Razón Social {getSortIcon('nombre_razonsocial')}</th>
                <th onClick={() => requestSort('descripcion')} style={{ cursor: 'pointer' }}>Descripción {getSortIcon('descripcion')}</th>
                <th style={{ textAlign: 'right', width: '200px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orgsPaginados.map((org) => (
                <tr key={org.id}>
                  <td style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{org.id}</td>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>{org.nombre_razonsocial}</td>
                  <td style={{ color: '#475569' }}>{org.descripcion || '-'}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => verRegionalesPorOrg(org)} className="cifas-btn cifas-btn--primary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                      Ver Regionales
                    </button>
                    <button onClick={() => iniciarEditarOrg(org)} className="cifas-btn cifas-btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                      Editar
                    </button>
                    <button onClick={() => eliminarOrg(org.id)} className="cifas-btn cifas-btn--pdf" style={{ padding: '6px 12px', fontSize: '11px' }}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {orgsAMostrar.length === 0 && !cargando && (
                <tr><td colSpan="4" className="cifas-table-empty">No hay Organismos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );};

  const renderListadoRegionales = () => {
    let regsAMostrar = vistaActual === 'filtrados' 
      ? regionales.filter(r => r.id_organismo === orgSeleccionado?.id)
      : regionales;

    if (filtroTexto) {
      const search = filtroTexto.toLowerCase();
      regsAMostrar = regsAMostrar.filter(r => 
        (r.nombre || '').toLowerCase().includes(search) || 
        (r.descripcion || '').toLowerCase().includes(search));}

    regsAMostrar = ordenarDatos(regsAMostrar);

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const regsPaginadas = regsAMostrar.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(regsAMostrar.length / itemsPorPagina);

    return (
      <div className="cifas-card">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p className="cifas-card__titulo">
              {vistaActual === 'filtrados' ? `Regionales del organismo: ${orgSeleccionado?.nombre_razonsocial}` : 'Todas las Regionales'}
            </p>
            <h2 className="cifas-card__main-name">Regionales</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={abrirModalExportar} className="cifas-btn cifas-btn--secondary" style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }}>
              Exportar Excel
            </button>
            <button onClick={volverAOrganismos} className="cifas-btn cifas-btn--secondary">
              ← Volver a Organismos
            </button>
            <button onClick={iniciarNuevaReg} className="cifas-btn cifas-btn--primary">
              + Crear Regional
            </button>
          </div>
        </header>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <input 
              type="text" 
              placeholder="Buscar por Nombre o Descripción..." 
              className="cifas-input" 
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{ margin: 0, backgroundColor: '#fff' }}
            />
          </div>
          {filtroTexto && (
            <button onClick={() => setFiltroTexto('')} className="cifas-btn cifas-btn--secondary">
              Limpiar Filtros
            </button>
          )}
        </div>
        {regsAMostrar.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
            <span>
              Mostrando {indicePrimerItem + 1} a {Math.min(indiceUltimoItem, regsAMostrar.length)} de {regsAMostrar.length} regionales
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
        <div className="cifas-table-wrap">
          <table className="cifas-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('id')} style={{ width: '80px', cursor: 'pointer' }}>ID {getSortIcon('id')}</th>
                <th onClick={() => requestSort('nombre')} style={{ cursor: 'pointer' }}>Regional {getSortIcon('nombre')}</th>
                <th onClick={() => requestSort('descripcion')} style={{ cursor: 'pointer' }}>Descripción {getSortIcon('descripcion')}</th>
                {vistaActual === 'todos' && (
                  <th onClick={() => requestSort('organismo')} style={{ cursor: 'pointer' }}>Organismo {getSortIcon('organismo')}</th>
                )}
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {regsPaginadas.map((reg) => (
                <tr key={reg.id}>
                  <td style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{reg.id}</td>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>{reg.nombre}</td>
                  <td>{reg.descripcion || '-'}</td>
                  {vistaActual === 'todos' && (
                    <td>
                      <span className="cifas-chip" style={{ background: '#eff6ff', color: '#2563eb', fontSize: '10px' }}>
                        {reg.organismo?.nombre_razonsocial || 'Sin asignar'}
                      </span>
                    </td>
                  )}
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => iniciarEditarReg(reg)} className="cifas-btn cifas-btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                      Editar
                    </button>
                    <button onClick={() => eliminarReg(reg.id)} className="cifas-btn cifas-btn--pdf" style={{ padding: '6px 12px', fontSize: '11px' }}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {regsAMostrar.length === 0 && !cargando && (
                <tr><td colSpan={vistaActual === 'todos' ? "5" : "4"} className="cifas-table-empty">No hay regionales para mostrar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );};

  const renderFormOrg = () => (
    <div className="cifas-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h2 className="cifas-card__main-name" style={{ fontSize: '20px', color: '#1e3a8a' }}>
            {editandoOrgId === 'nuevo' ? 'Nuevo Organismo' : 'Editar Organismo'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={volverAOrganismos} className="cifas-btn cifas-btn--secondary">← Cancelar</button>
          <button type="submit" form="form-org" className="cifas-btn cifas-btn--primary">Guardar</button>
        </div>
      </header>
      <form id="form-org" onSubmit={guardarOrg}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <label className="cifas-field">
            <span>Nombre / Razón Social</span>
            <input type="text" value={formOrg.nombre_razonsocial} onChange={(e) => setFormOrg({...formOrg, nombre_razonsocial: e.target.value})} required className="cifas-input" />
          </label>
          <label className="cifas-field">
            <span>Descripción</span>
            <input type="text" value={formOrg.descripcion} onChange={(e) => setFormOrg({...formOrg, descripcion: e.target.value})} className="cifas-input" />
          </label>
        </div>
      </form>
    </div>
  );

  const renderFormReg = () => (
    <div className="cifas-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h2 className="cifas-card__main-name" style={{ fontSize: '20px', color: '#1e3a8a' }}>
            {editandoRegId === 'nuevo' ? 'Nueva Regional' : 'Editar Regional'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => setVistaActual(orgSeleccionado ? 'filtrados' : 'todos')} className="cifas-btn cifas-btn--secondary">← Cancelar</button>
          <button type="submit" form="form-reg" className="cifas-btn cifas-btn--primary">Guardar</button>
        </div>
      </header>

      <form id="form-reg" onSubmit={guardarReg}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <label className="cifas-field">
            <span>Nombre de la Regional</span>
            <input type="text" value={formReg.nombre} onChange={(e) => setFormReg({...formReg, nombre: e.target.value})} required className="cifas-input" />
          </label>
          <label className="cifas-field">
            <span>Organismo Asociado</span>
            <select value={formReg.id_organismo} onChange={(e) => setFormReg({...formReg, id_organismo: e.target.value})} className="cifas-select" required>
              <option value="">-- Seleccionar Organismo --</option>
              {organismos.map(o => (
                <option key={o.id} value={o.id}>{o.nombre_razonsocial}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label className="cifas-field">
            <span>Descripción</span>
            <input type="text" value={formReg.descripcion} onChange={(e) => setFormReg({...formReg, descripcion: e.target.value})} className="cifas-input" />
          </label>
        </div>
      </form>
    </div>);

  return (
    <>
      {modalExportar && renderModalExportar()}
      {vistaActual === 'organismos' && renderListadoOrganismos()}
      {(vistaActual === 'todos' || vistaActual === 'filtrados') && renderListadoRegionales()}
      {vistaActual === 'form-org' && renderFormOrg()}
      {vistaActual === 'form-reg' && renderFormReg()}
    </>
  );};

export default Organismos;