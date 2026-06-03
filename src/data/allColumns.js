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
    { key: 'cliente',              label: 'Cliente' },
    { key: 'presupuesto',          label: 'Presupuesto' },
    { key: 'organismo',            label: 'Organismo' },
    { key: 'regional',             label: 'Regional' },
    { key: 'usuarioSeguimiento',   label: 'Usuario Seguimiento Tarea' },
    { key: 'tramite',              label: 'Trámite' },
    { key: 'id',                   label: 'ID' },
    { key: 'tarea',                label: 'Tarea' },
    { key: 'estado',               label: 'Estado' },
    { key: 'usuarioSegPresupuesto', label: 'Usuario Seg. Presupuesto' },
    { key: 'fechaVto',             label: 'Fecha Vto.' },
    { key: 'nroExpediente',        label: 'Nro. Expediente' },
    { key: 'ultimoCambio',         label: 'Último Cambio' },
    { key: 'obs',                  label: 'Observaciones' },
  ],

  tramites: [
    { key: 'id',                   label: 'ID' },
    { key: 'nombre',               label: 'Nombre' },
    { key: 'organismo',            label: 'Organismo' },
    { key: 'area',                 label: 'Área' },
    { key: 'tramiteDescripcion',   label: 'Descripción Trámite' },
    { key: 'tareaId',              label: 'Tarea ID' },
    { key: 'tareaNombre',          label: 'Tarea Nombre' },
    { key: 'tareaDescripcion',     label: 'Tarea Descripción' },
    { key: 'tareaCategoria',       label: 'Tarea Categoría' },
    { key: 'obs',                  label: 'Observaciones' },
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
    { key: 'renspa',               label: 'RENSPA' },
    { key: 'establecimiento',      label: 'Establecimiento' },
    { key: 'titular',              label: 'Titular' },
    { key: 'cuit',                 label: 'CUIT' },
    { key: 'tipo',                 label: 'Tipo' },
    { key: 'provincia',            label: 'Provincia' },
    { key: 'partido',              label: 'Partido' },
    { key: 'explotacion',          label: 'Explotación' },
    { key: 'latitud',              label: 'Latitud' },
    { key: 'longitud',             label: 'Longitud' },
  ],

  pedidosPendientes: [
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