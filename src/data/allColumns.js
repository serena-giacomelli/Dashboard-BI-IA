/**
 * allColumns.js
 *
 * Define TODAS las columnas exportables para cada tipo de informe.
 * Estas se usan en el modal de selección y en la exportación.
 *
 * Importar en reportsData.js y agregar como propiedad `allColumns` a cada config.
 *
 * Diferencia con `columns`:
 *   - `columns`    → las que se muestran en la tabla de vista previa (subset reducido)
 *   - `allColumns` → todas las disponibles para exportar (conjunto completo)
 */

export const allColumnsByReport = {

tareas: [
    { key: 'idTarea',              label: 'ID Tarea' },
    { key: 'tarea',                label: 'Tarea' },
    { key: 'presupuesto',          label: 'Presupuesto' },
    { key: 'tramite',              label: 'Trámite' },
    { key: 'usuarioAsignado',      label: 'Usuario Asignado' },
    { key: 'estado',               label: 'Estado de Tarea' },
    { key: 'fechaInicio',          label: 'Fecha Inicio' },
    { key: 'fechaFin',             label: 'Fecha Fin' },
    { key: 'contactoCliente',      label: 'Contacto Cliente' },
    { key: 'contactoOrganismo',    label: 'Contacto Organismo' },
    { key: 'directorTecnico',      label: 'Director Técnico' },
    { key: 'establecimiento',      label: 'Establecimiento' },
    { key: 'obsInternas',          label: 'Observaciones Internas' },
  ],

  tramites: [
    { key: 'id',                   label: 'ID' },
    { key: 'nombre',               label: 'Nombre' },
    // Datos de Expediente
    { key: 'nroExpediente',        label: 'N° Expediente' },
    { key: 'nombreExpediente',     label: 'Nombre Expediente' },
    { key: 'fechaNotificacion',    label: 'Fecha Notificación Requeridos' },
    { key: 'fechaVtoRegistro',     label: 'Fecha Vto. Registro' },
    { key: 'estadoPresupuesto',    label: 'Estado Presupuesto' },
    { key: 'nroExpedienteSec',     label: 'N° Expediente Secundario' },
    { key: 'nombreExpedienteSec',  label: 'Nombre Expediente Secundario' },
    { key: 'marca',                label: 'Marca' },
    { key: 'nroRegistro',          label: 'N° de Registro' },
    // Datos Financieros asociados al trámite
    { key: 'organismo',            label: 'Organismo' },
    { key: 'tipoArancel',          label: 'Tipo de Arancel' },
    { key: 'montoArancel',         label: 'Monto Arancel' },
    { key: 'honorarioMonto',       label: 'Honorario ($)' },
    { key: 'subcompania',          label: 'Subcompañía' },
    { key: 'porcDistribucion',     label: 'Porcentaje (%)' },
  ],

  vencimientos: [
    { key: 'id',                   label: 'ID' },
    { key: 'razonSocial',          label: 'Razón Social' },
    { key: 'tipo',                 label: 'Tipo' },
    { key: 'vencimiento',          label: 'Fecha Vto.' },
    { key: 'nro',                  label: 'Nro.' },
    { key: 'establecimiento',      label: 'Establecimiento' },
    { key: 'obs',                  label: 'Observaciones' },
    { key: 'usuario',              label: 'Usuario' },
  ],

  engordes: [
    { key: 'id',                   label: 'ID' },
    { key: 'renspa',               label: 'RENSPA' },
    { key: 'establecimiento',      label: 'Establecimiento' },
    { key: 'pertenencia',          label: 'Pertenencia' },
    { key: 'titular',              label: 'Titular' },
    { key: 'cuit',                 label: 'CUIT' },
    { key: 'tipo',                 label: 'Tipo' },
    { key: 'estado',               label: 'Estado' },
    { key: 'provincia',            label: 'Provincia' },
    { key: 'partido',              label: 'Partido' },
    { key: 'explotacion',          label: 'Explotación' },
    { key: 'latitud',              label: 'Latitud' },
    { key: 'longitud',             label: 'Longitud' },
  ],

  pedidosPendientes: [
    { key: 'id',                   label: 'ID' },
    { key: 'codigoCliente',        label: 'Código Cliente' },
    { key: 'tipoDocCliente',       label: 'Tipo Doc. Cliente' },
    { key: 'nroDocCliente',        label: 'Nro. Doc. Cliente' },
    { key: 'emailCliente',         label: 'Email Cliente' },
    { key: 'nombreCliente',        label: 'Nombre Cliente' },
    { key: 'posFiscalCliente',     label: 'Pos. Fiscal Cliente' },
    { key: 'categoriaCliente',     label: 'Categoría Cliente' },
    { key: 'codPostalCliente',     label: 'Cód. Postal Cliente' },
    { key: 'direccionCliente',     label: 'Dirección Cliente' },
    { key: 'localidadCliente',     label: 'Localidad Cliente' },
    { key: 'codTipoVenta',         label: 'Cód. Tipo Venta' },
    { key: 'codExterno',           label: 'Cód. Externo' },
    { key: 'cuitSubcompania',      label: 'CUIT Subcompañía' },
    { key: 'fecha',                label: 'Fecha' },
    { key: 'organismo',            label: 'Organismo' },
    { key: 'descripcion',          label: 'Descripción' },
    { key: 'precioUnitario',       label: 'Precio Unitario' },
    { key: 'cantidad',             label: 'Cantidad' },
    { key: 'codProducto',          label: 'Cód. Producto' },
    { key: 'presupuesto',          label: 'Presupuesto' },
    { key: 'expediente',           label: 'Expediente' },
    { key: 'total',                label: 'Total' },
  ],

};