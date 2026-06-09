// src/data/clientesDB.js
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
    enviarBoletin: false 
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
    enviarBoletin: true 
  }
];