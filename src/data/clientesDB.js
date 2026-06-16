// src/data/clientesDB.js

// 1. PORTFOLIO DE SERVICIOS REALES (Extraídos de Servicios.jsx)
export const portfolioServicios = [
  {
    id: 1,
    nombre: 'Gestión de Habilitaciones e Inscripciones',
    descripcion: 'Trámites integrales y registros ante SENASA, RUCA, RNE y RNPA para plantas e industrias.',
    categoria: 'Regulaciones',
    modalidad: 'Por Proyecto',
    precioBase: 450000,
    actividadesArca: ['016119', '749009']
  },
  {
    id: 2,
    nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío',
    descripcion: 'Evaluación técnica de eficiencia energética en cámaras frigoríficas y túneles de congelado.',
    categoria: 'Ingeniería',
    modalidad: 'Por Hora',
    precioBase: 25000,
    actividadesArca: ['101011', '711003']
  }
];

// 2. DIRECTORIO DE CLIENTES CON EL FLUJO DE INFORMACIÓN CORREGIDO (CON ARCA EN CASCADA)
export const initialClientes = [
  { 
    id: 1, 
    razonSocial: "AgroRosario S.A.", 
    cuit: "30-71548962-9", 
    mailFacturacionPrimario: "administracion@agrorosario.com",
    mailFacturacionSecundario: "contabilidad@agrorosario.com",
    saldo: 0,
    direccionAdministrativa: "Av. Carballo 180, Piso 4",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta 34 Km 5",
    localidadEstablecimiento: "Ibarlucea",
    domicilioFiscal: "Av. Carballo 180, Piso 4",
    localidadFiscal: "Rosario",
    tipoCliente: "CIFAS",
    enviarBoletin: false,
    contactos: [
      { nombre: 'Carlos', apellido: 'Gómez', telefono: '0341-4321122', interno: '101', celular: '3415111222', mail: 'cgomez@agrorosario.com', cargo: 'TITULAR', obs: 'Firmante de contratos' }
    ],
    historia: [
      { descripcion: 'Alta de cliente en el sistema y configuración de abonos.', fecha: '12/01/2026', tipo: 'Historia' }
    ],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '450000', estado: 'Activo', fechaInicio: '01/02/2026', actividadesArca: ['016119', '749009'] }
    ]
  },
  { 
    id: 2, 
    razonSocial: "Metalúrgica del Núcleo S.R.L.", 
    cuit: "30-58964123-4", 
    mailFacturacionPrimario: "finanzas@metanucleo.com.ar",
    mailFacturacionSecundario: "",
    saldo: -125000,
    direccionAdministrativa: "Ruta 21 Km 7",
    localidadAdmin: "Villa Constitución",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta 21 Km 7",
    localidadEstablecimiento: "Villa Constitución",
    domicilioFiscal: "Av. San Martín 1200",
    localidadFiscal: "Rosario",
    tipoCliente: "POTENCIAL",
    enviarBoletin: false,
    contactos: [
      { nombre: 'Ricardo', apellido: 'Ferreyra', telefono: '03400-474849', interno: '', celular: '3400611223', mail: 'rferreyra@metanucleo.com.ar', cargo: 'APODERADO', obs: 'Contactar por deudas pend.' }
    ],
    historia: [
      { descripcion: 'Se reclamó pago de cuotas atrasadas del servicio suspendido.', fecha: '05/06/2026', tipo: 'Llamada' }
    ],
    servicios: [
      { nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío', abono: '90000', estado: 'Activo', fechaInicio: '15/05/2025', actividadesArca: ['101011', '711003'] }
    ]
  },
  {
    id: 3,
    razonSocial: "Lácteos del Sur S.A.",
    cuit: "30-70124587-6",
    mailFacturacionPrimario: "facturacion@lacteosdelsur.com.ar",
    mailFacturacionSecundario: "tesoreria@lacteosdelsur.com.ar",
    saldo: 85000,
    direccionAdministrativa: "Bv. Oroño 1450",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta 9 Km 302",
    localidadEstablecimiento: "Roldán",
    domicilioFiscal: "Bv. Oroño 1450",
    localidadFiscal: "Rosario",
    tipoCliente: "CIFAS",
    enviarBoletin: false,
    contactos: [
      { nombre: 'María Laura', apellido: 'Piazza', telefono: '0341-4809000', interno: '42', celular: '3416554433', mail: 'mlpiazza@lacteosdelsur.com', cargo: 'CONTADOR', obs: 'Envío directo de facturación' }
    ],
    historia: [
      { descripcion: 'Ajuste de tarifas por volumen de personal liquidado.', fecha: '20/04/2026', tipo: 'Reunión' }
    ],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '450000', estado: 'Activo', fechaInicio: '01/01/2025', actividadesArca: ['016119', '749009'] },
      { nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío', abono: '120000', estado: 'Activo', fechaInicio: '15/03/2025', actividadesArca: ['101011', '711003'] }
    ]
  },
  {
    id: 4,
    razonSocial: "Frigorífico La Esperanza S.R.L.",
    cuit: "30-68452147-2",
    mailFacturacionPrimario: "admin@frilaesperanza.com",
    mailFacturacionSecundario: "",
    saldo: -45000,
    direccionAdministrativa: "Mitre 820",
    localidadAdmin: "Casilda",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta 33 Km 742",
    localidadEstablecimiento: "Casilda",
    domicilioFiscal: "Mitre 820",
    localidadFiscal: "Casilda",
    tipoCliente: "POTENCIAL",
    enviarBoletin: false,
    contactos: [],
    history: [],
    servicios: [
      { nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío', abono: '180000', estado: 'Suspendido', fechaInicio: '01/03/2025', actividadesArca: ['101011', '711003'] }
    ]
  },
  {
    id: 5,
    razonSocial: "Agroinsumos Pampeanos S.A.",
    cuit: "30-71985634-1",
    mailFacturacionPrimario: "pagos@agropampeanos.com.ar",
    mailFacturacionSecundario: "",
    saldo: 215000,
    direccionAdministrativa: "San Lorenzo 2145",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta A012 Km 11",
    localidadEstablecimiento: "Pérez",
    domicilioFiscal: "San Lorenzo 2145",
    localidadFiscal: "Rosario",
    tipoCliente: "CIFAS",
    enviarBoletin: false,
    contactos: [
      { nombre: 'Andrés', apellido: 'Vignatti', telefono: '', interno: '', celular: '3415998877', mail: 'avignatti@agropampeanos.com', cargo: 'TITULAR', obs: '' }
    ],
    historia: [],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '380000', estado: 'Activo', fechaInicio: '15/11/2025', actividadesArca: ['016119', '749009'] }
    ]
  },
  {
    id: 6,
    razonSocial: "Servicios Industriales Delta S.R.L.",
    cuit: "30-63254789-5",
    mailFacturacionPrimario: "administracion@sidelta.com",
    mailFacturacionSecundario: "compras@sidelta.com",
    saldo: -98000,
    direccionAdministrativa: "Urquiza 3550",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Parque Industrial Oeste",
    localidadEstablecimiento: "Alvear",
    domicilioFiscal: "Urquiza 3550",
    localidadFiscal: "Rosario",
    tipoCliente: "POTENCIAL",
    enviarBoletin: false,
    contactos: [],
    historia: [],
    servicios: [
      { nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío', abono: '75000', estado: 'Suspendido', fechaInicio: '01/08/2025', actividadesArca: ['101011', '711003'] }
    ]
  },
  {
    id: 7,
    razonSocial: "Alimentos Premium S.A.",
    cuit: "30-72894561-3",
    mailFacturacionPrimario: "facturas@alimentospremium.com",
    mailFacturacionSecundario: "",
    saldo: 15000,
    direccionAdministrativa: "España 980",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta 11 Km 345",
    localidadEstablecimiento: "San Lorenzo",
    domicilioFiscal: "España 980",
    localidadFiscal: "Rosario",
    tipoCliente: "CIFAS",
    enviarBoletin: true,
    contactos: [
      { nombre: 'Esteban', apellido: 'Quito', telefono: '0341-4261155', interno: '12', celular: '', mail: 'equito@alimentospremium.com', cargo: 'TITULAR', obs: 'Prefiere contacto vía email' }
    ],
    historia: [],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '450000', estado: 'Activo', fechaInicio: '20/10/2025', actividadesArca: ['016119', '749009'] }
    ]
  },
  {
    id: 8,
    razonSocial: "BioNutrición Animal S.R.L.",
    cuit: "30-64587321-0",
    mailFacturacionPrimario: "administracion@bionutricion.com.ar",
    mailFacturacionSecundario: "",
    saldo: -18000,
    direccionAdministrativa: "Belgrano 1220",
    localidadAdmin: "Rafaela",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Parque Industrial Rafaela",
    localidadEstablecimiento: "Rafaela",
    domicilioFiscal: "Belgrano 1220",
    localidadFiscal: "Rafaela",
    tipoCliente: "POTENCIAL",
    enviarBoletin: false,
    contactos: [],
    historia: [],
    servicios: [] // Vacío de forma intencional para tests visuales
  },
  {
    id: 9,
    razonSocial: "Aceitera Regional S.A.",
    cuit: "30-71478523-7",
    mailFacturacionPrimario: "tesoreria@aceiteraregional.com",
    mailFacturacionSecundario: "contable@aceiteraregional.com",
    saldo: 325000,
    direccionAdministrativa: "Córdoba 2140",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Puerto General San Martín",
    localidadEstablecimiento: "San Martín",
    domicilioFiscal: "Córdoba 2140",
    localidadFiscal: "Rosario",
    tipoCliente: "CIFAS",
    enviarBoletin: false,
    contactos: [
      { nombre: 'Laura', apellido: 'Méndez', telefono: '0341-4103000', interno: '310', celular: '3413998811', mail: 'lmendez@aceiteraregional.com', cargo: 'APODERADO', obs: 'Gerente Financiera' }
    ],
    historia: [
      { descripcion: 'Reunión presencial por cierre de auditoría anual.', fecha: '14/05/2026', tipo: 'Reunión' }
    ],
    servicios: [
      { nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío', abono: '250000', estado: 'Activo', fechaInicio: '01/01/2024', actividadesArca: ['101011', '711003'] }
    ]
  },
  {
    id: 10,
    razonSocial: "Ganadera del Litoral S.A.",
    cuit: "30-69012548-4",
    mailFacturacionPrimario: "facturacion@ganaderalitoral.com",
    mailFacturacionSecundario: "",
    saldo: 5000,
    direccionAdministrativa: "Av. Pellegrini 2850",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta 18 Km 22",
    localidadEstablecimiento: "Piñero",
    domicilioFiscal: "Av. Pellegrini 2850",
    localidadFiscal: "Rosario",
    tipoCliente: "POTENCIAL",
    enviarBoletin: false,
    contactos: [],
    historia: [],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '120000', estado: 'Activo', fechaInicio: '12/09/2025', actividadesArca: ['016119', '749009'] }
    ]
  },
  {
    id: 11,
    razonSocial: "Molinos del Paraná S.R.L.",
    cuit: "30-67521489-2",
    mailFacturacionPrimario: "pagos@molinosparana.com",
    mailFacturacionSecundario: "",
    saldo: -73000,
    direccionAdministrativa: "Sarmiento 1800",
    localidadAdmin: "San Nicolás",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Zona Industrial Norte",
    localidadEstablecimiento: "San Nicolás",
    domicilioFiscal: "Sarmiento 1800",
    localidadFiscal: "San Nicolás",
    tipoCliente: "CIFAS",
    enviarBoletin: false,
    contactos: [],
    historia: [],
    servicios: [
      { nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío', abono: '85000', estado: 'Activo', fechaInicio: '01/11/2025', actividadesArca: ['101011', '711003'] }
    ]
  },
  {
    id: 12,
    razonSocial: "Campo Fértil Agropecuaria S.A.",
    cuit: "30-72145896-5",
    mailFacturacionPrimario: "administracion@campofertil.com.ar",
    mailFacturacionSecundario: "",
    saldo: 118000,
    direccionAdministrativa: "25 de Mayo 720",
    localidadAdmin: "Venado Tuerto",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta 8 Km 365",
    localidadEstablecimiento: "Venado Tuerto",
    domicilioFiscal: "25 de Mayo 720",
    localidadFiscal: "Venado Tuerto",
    tipoCliente: "CIFAS",
    enviarBoletin: false,
    contactos: [
      { nombre: 'Federico', apellido: 'Ibañez', telefono: '03462-422554', interno: '', celular: '3462155544', mail: 'fibanez@campofertil.com', cargo: 'TITULAR', obs: '' }
    ],
    historia: [],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '450000', estado: 'Activo', fechaInicio: '01/01/2026', actividadesArca: ['016119', '749009'] }
    ]
  },
  {
    id: 13,
    razonSocial: "Proteínas Argentinas S.R.L.",
    cuit: "30-69852147-8",
    mailFacturacionPrimario: "facturacion@proteinasarg.com",
    mailFacturacionSecundario: "gerencia@proteinasarg.com",
    saldo: -210000,
    direccionAdministrativa: "Moreno 1350",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Ruta AO12 Km 15",
    localidadEstablecimiento: "Alvear",
    domicilioFiscal: "Moreno 1350",
    localidadFiscal: "Rosario",
    tipoCliente: "POTENCIAL",
    enviarBoletin: false,
    contactos: [],
    historia: [],
    servicios: [
      { nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío', abono: '150000', estado: 'Suspendido', fechaInicio: '15/06/2025', actividadesArca: ['101011', '711003'] }
    ]
  },
  {
    id: 14,
    razonSocial: "Exportadora Santa Fe S.A.",
    cuit: "30-73014589-6",
    mailFacturacionPrimario: "contabilidad@exportsf.com",
    mailFacturacionSecundario: "",
    saldo: 780000,
    direccionAdministrativa: "Wheelwright 1650",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Terminal Portuaria Sur",
    localidadEstablecimiento: "Rosario",
    domicilioFiscal: "Wheelwright 1650",
    localidadFiscal: "Rosario",
    tipoCliente: "CIFAS",
    enviarBoletin: false,
    contactos: [
      { nombre: 'Gonzalo', apellido: 'Palacios', telefono: '0341-4498000', interno: '502', celular: '3415887766', mail: 'gpalacios@exportsf.com', cargo: 'APODERADO', obs: 'Contacto Corporativo Directo' }
    ],
    historia: [
      { descripcion: 'Llamada telefónica para coordinar auditoría externa de aduanas.', fecha: '11/06/2026', tipo: 'Llamada' }
    ],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '450000', estado: 'Activo', fechaInicio: '01/01/2024', actividadesArca: ['016119', '749009'] }
    ]
  },
  {
    id: 15,
    razonSocial: "Tecnología Alimentaria Integral S.R.L.",
    cuit: "30-68235741-9",
    mailFacturacionPrimario: "admin@tecalin.com.ar",
    mailFacturacionSecundario: "",
    saldo: 42000,
    direccionAdministrativa: "Laprida 980",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Parque Industrial Alvear",
    localidadEstablecimiento: "Alvear",
    domicilioFiscal: "Laprida 980",
    localidadFiscal: "Rosario",
    tipoCliente: "POTENCIAL",
    enviarBoletin: false,
    contactos: [],
    historia: [],
    servicios: [
      { nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío', abono: '95000', estado: 'Activo', fechaInicio: '10/02/2026', actividadesArca: ['101011', '711003'] }
    ]
  },
  {
    id: 16,
    razonSocial: "NutriFeed Argentina S.A.",
    cuit: "30-74215896-2",
    mailFacturacionPrimario: "facturas@nutrifeed.com.ar",
    mailFacturacionSecundario: "",
    saldo: -12000,
    direccionAdministrativa: "Rivadavia 2540",
    localidadAdmin: "Esperanza",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Zona Rural Norte",
    localidadEstablecimiento: "Esperanza",
    domicilioFiscal: "Rivadavia 2540",
    localidadFiscal: "Esperanza",
    tipoCliente: "CIFAS",
    enviarBoletin: false,
    contactos: [],
    historia: [],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '320000', estado: 'Activo', fechaInicio: '01/03/2026', actividadesArca: ['016119', '749009'] }
    ]
  },
  {
    id: 17,
    razonSocial: "Logística Agroexportadora S.R.L.",
    cuit: "30-75489632-1",
    mailFacturacionPrimario: "tesoreria@logagro.com",
    mailFacturacionSecundario: "administracion@logagro.com",
    saldo: 264000,
    direccionAdministrativa: "Av. Francia 1850",
    localidadAdmin: "Rosario",
    condicionFiscal: "RESP INSCRIPTO",
    direccionEstablecimiento: "Puerto Norte",
    localidadEstablecimiento: "Rosario",
    domicilioFiscal: "Av. Francia 1850",
    localidadFiscal: "Rosario",
    tipoCliente: "POTENCIAL",
    enviarBoletin: false,
    contactos: [
      { nombre: 'Juan Manuel', apellido: 'Rosas', telefono: '0341-4354040', interno: '', cellular: '3416001122', mail: 'jmrosas@logagro.com', cargo: 'TITULAR', obs: '' }
    ],
    historia: [],
    servicios: [
      { nombre: 'Gestión de Habilitaciones e Inscripciones', abono: '450000', estado: 'Activo', fechaInicio: '01/01/2025', actividadesArca: ['016119', '749009'] }
    ]
  }
];