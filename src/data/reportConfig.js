export const allColumnsByReport = {
  servicios: [
     { key: 'idServicio', label: 'ID Servicio' },
     { key: 'servicio', label: 'Nombre Servicio' },
     { key: 'presupuesto', label: 'Presupuesto' },
     { key: 'tramite', label: 'Trámite' },
     { key: 'usuarioAsignado', label: 'Usuario Asignado' },
     { key: 'estado', label: 'Estado de Servicio' },
     { key: 'fechaInicio', label: 'Fecha Inicio' },
     { key: 'fechaFin', label: 'Fecha Fin' },
     { key: 'contactoCliente', label: 'Contacto Cliente' },
     { key: 'contactoOrganismo', label: 'Contacto Organismo' },
     { key: 'directorTecnico', label: 'Director Técnico' },
     { key: 'establecimiento', label: 'Establecimiento' },
     { key: 'obsInternas', label: 'Observaciones Internas' },
     { key: 'actividadesArca', label: 'Actividades ARCA' },
  ],
  tramites: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'nroExpediente', label: 'Nº Expediente' },
    { key: 'nombreExpediente', label: 'Nombre Expediente' },
    { key: 'fechaNotificacion', label: 'Fecha Notificación Requeridos' },
    { key: 'fechaVtoRegistro', label: 'Fecha Vto. Registro' },
    { key: 'estadoPresupuesto', label: 'Estado Presupuesto' },
    { key: 'nroExpedienteSec', label: 'Nº Expediente Secundario' },
    { key: 'nombreExpedienteSec', label: 'Nombre Expediente Secundario' },
    { key: 'marca', label: 'Marca' },
    { key: 'nroRegistro', label: 'Nº de Registro' },
    { key: 'organismo', label: 'Organismo' },
    { key: 'tipoArancel', label: 'Tipo de Arancel' },
    { key: 'montoArancel', label: 'Monto Arancel' },
    { key: 'honorarioMonto', label: 'Honorario ($)' },
    { key: 'subcompania', label: 'Subcompañía' },
    { key: 'porcDistribucion', label: 'Porcentaje (%)' },
  ],
  vencimientos: [
    { key: 'id', label: 'ID' },
    { key: 'razonSocial', label: 'Razón Social' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'vencimiento', label: 'Fecha Vto.' },
    { key: 'nro', label: 'Nro.' },
    { key: 'establecimiento', label: 'Establecimiento' },
    { key: 'obs', label: 'Observaciones' },
    { key: 'usuario', label: 'Usuario' },
  ],
  engordes: [
    { key: 'id', label: 'ID' },
    { key: 'renspa', label: 'RENSPA' },
    { key: 'establecimiento', label: 'Establecimiento' },
    { key: 'pertenencia', label: 'Pertenencia' },
    { key: 'titular', label: 'Titular' },
    { key: 'cuit', label: 'CUIT' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
    { key: 'provincia', label: 'Provincia' },
    { key: 'partido', label: 'Partido' },
    { key: 'explotacion', label: 'Explotación' },
    { key: 'latitud', label: 'Latitud' },
    { key: 'longitud', label: 'Longitud' },
  ],
  pedidosPendientes: [
    { key: 'id', label: 'ID' },
    { key: 'codigoCliente', label: 'Código Cliente' },
    { key: 'tipoDocCliente', label: 'Tipo Doc. Cliente' },
    { key: 'nroDocCliente', label: 'Nro. Doc. Cliente' },
    { key: 'emailCliente', label: 'Email Cliente' },
    { key: 'nombreCliente', label: 'Nombre Cliente' },
    { key: 'posFiscalCliente', label: 'Pos. Fiscal Cliente' },
    { key: 'categoriaCliente', label: 'Categoría Cliente' },
    { key: 'codPostalCliente	', label: 'Céd. Postal Cliente' },
    { key: 'direccionCliente', label: 'Dirección Cliente' },
    { key: 'localidadCliente', label: 'Localidad Cliente' },
    { key: 'codTipoVenta', label: 'Cód. Tipo Venta' },
    { key: 'codExterno', label: 'Cód. Externo' },
    { key: 'cuitSubcompania', label: 'CUIT Subcompañía' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'organismo', label: 'Organismo' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'precioUnitario', label: 'Precio Unitario' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'codProducto', label: 'Cód. Producto' },
    { key: 'presupuesto', label: 'Presupuesto' },
    { key: 'expediente', label: 'Expediente' },
    { key: 'total', label: 'Total' },
  ]
};

export const budgetRows = [
  { nroPresupuesto: '10234', cliente: 'ALBERTO BERARDI S.A.', subcompania: 'Subcompañía A', usuarioSeguimiento: 'Juan Pérez', fechaCreacion: '12/05/2025', estadoPresupuesto: 'Enviado', honorarioMonto: 107000 },
  { nroPresupuesto: '10233', cliente: 'BERARDI JOSE', subcompania: 'Subcompañía B', usuarioSeguimiento: 'Marí Méz', fechaCreacion: '08/05/2025', estadoPresupuesto: 'Revisión', honorarioMonto: 54000 }
];

export const defaultQuestionSuggestions = [
  "¿Qué cliente tiene el mayor total de honorarios?",
  "¿Cuántos presupuestos están en revisión?",
  "¿Qué recomendación darías para mejorar el seguimiento?"
];

export const reportConfigs = {
  servicios: {
    label: 'Servicios',
    description: 'Seguimiento operativo de servicios, responsables y estados.',
    filters: [
      { key: 'contactoCliente', label: 'Clientes', type: 'select', options: ['Todos', 'ALBERTO BERARDI S.A.', 'BERARDI JOSE', 'COOPERATIVA LA PAMPA', 'FRIGORIFICO SUR'] },
      { key: 'usuarioAsignado', label: 'Usuario', type: 'multiselect', options: ['M. Rojas', 'G. Perez', 'L. Gomez', 'C. Ruiz'] },
      { key: 'contactoOrganismo', label: 'Organismos', type: 'select', options: ['Todos', 'SENASA', 'ANMAT', 'INASE', 'INTA'] },
      { key: 'estados', label: 'Estados de servicios', type: 'multiselect', options: ['1. Pendiente de asignacion', '2. Asignada', '3. Servicio no aceptado', '4. En curso', '5. En obra', '6. Presentada', '7.Demorada por el cliente', '8. Demorada por el organismo', '9. Observada', '10. Finalizada', '11. Finalizada. no corresponde facturar', '12. Anualidad'] },
    ],
    columns: allColumnsByReport.servicios,
  },
  tramites: {
    label: 'Tramites',
    description: 'Consulta de tramites por organismo y area responsable.',
    filters: [
      { key: 'organismo', label: 'Organismos', type: 'select', options: ['Todos', 'SENASA', 'ANMAT', 'INTA', 'Municipalidad'] },
      { key: 'area', label: 'Area', type: 'select', options: ['Todas', 'Tecnica', 'Comercial', 'Administracion', 'Legal'] },
    ],
    columns: allColumnsByReport.tramites,
  },
  vencimientos: {
    label: 'Vencimientos',
    description: 'Alertas de vencimiento por cliente, usuario y rango de fechas.',
    filters: [
      { key: 'razonSocial', label: 'Razon Social', type: 'select', options: ['Todos', 'ALBERTO BERARDI S.A.', 'BERARDI JOSE', 'COOPERATIVA LA PAMPA', 'FRIGORIFICO SUR'] },
      { key: 'usuario', label: 'Usuario', type: 'multiselect', options: ['M. Rojas', 'G. Perez', 'L. Gomez', 'C. Ruiz'] },
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date' },
    ],
    columns: allColumnsByReport.vencimientos,
  },
  engordes: {
    label: 'Engordes',
    description: 'Seguimiento por provincia, partido y tipo de acceso.',
    filters: [
      { key: 'provincia', label: 'Provincias', type: 'select', options: ['Todas', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'CABA', 'Cordoba', 'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucuman'] },
      { key: 'partido', label: 'Partido / localidad', type: 'select', options: ['Todos', 'La Matanza', 'General Pueyrredon', 'Rosario', 'Cordoba Capital', 'Godoy Cruz', 'Neuquen Capital', 'Rio Gallegos', 'San Miguel de Tucuman', 'Posadas', 'Parana', 'Salta Capital', 'Bahia Blanca', 'San Fernando del Valle de Catamarca', 'Resistencia', 'Comodoro Rivadavia'] },
      { key: 'pertenencia', label: 'Se encuentra', type: 'multiselect', options: ['Administrador', 'Usuario'], },
    ],
    columns: allColumnsByReport.engordes,
  },
  pedidosPendientes: {
    label: 'Pedidos pendientes',
    description: 'Pedidos abiertos con rango de fechas para control de salida.',
    filters: [
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date' },
    ],
    columns: allColumnsByReport.pedidosPendientes,
  }
};