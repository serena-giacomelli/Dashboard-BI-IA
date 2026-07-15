import { createClient } from '@supabase/supabase-js';
import { 
  actividadesArca, actividadesRuca, actividadesSenasa, 
  clientesData, serviciosData, budgetRows, reportConfigs
} from './src/data/mockDB.js';

// Ingresa aquí tus credenciales (las puedes obtener de Project Settings -> API)
const SUPABASE_URL = 'https://riabiqiycbpwnmbqtead.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYWJpcWl5Y2Jwd25tYnF0ZWFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwODI1MiwiZXhwIjoyMDk5Njg0MjUyfQ.z3GOOGp2zL8aTEGokzFyDEuQ1Ji5uabAzVTlGU6Xf7g'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrarDatos() {
  console.log('--- Iniciando migración a Supabase ---');

  // 1. Catálogos de Actividades
  for (const act of actividadesRuca) {
    await supabase.from('actividades_ruca').insert({ codigo: act.codigo, nombre: act.nombre });
  }
  for (const act of actividadesSenasa) {
    await supabase.from('actividades_senasa').insert({ codigo: act.codigo, nombre: act.nombre });
  }
  for (const act of actividadesArca) {
    await supabase.from('actividades_arca').insert({ codigo: act.codigo, nombre: act.nombre });
    
    // Vinculaciones ARCA-RUCA
    if (act.vinculos && act.vinculos.ruca) {
      for (const ruca of act.vinculos.ruca) {
        await supabase.from('vinculacion_arca_ruca').insert({ arca_codigo: act.codigo, ruca_codigo: ruca });
      }
    }
    // Vinculaciones ARCA-SENASA
    if (act.vinculos && act.vinculos.senasa) {
      for (const senasa of act.vinculos.senasa) {
        await supabase.from('vinculacion_arca_senasa').insert({ arca_codigo: act.codigo, senasa_codigo: senasa });
      }
    }
  }

  // 2. Catálogo de Servicios
  for (const serv of serviciosData) {
    await supabase.from('servicios_catalogo').insert({
      id: serv.id,
      id_servicio: serv.idServicio,
      servicio: serv.servicio,
      descripcion: serv.descripcion,
      categoria: serv.categoria,
      modalidad: serv.modalidad,
      presupuesto: serv.presupuesto,
      tramite: serv.tramite
    });
  }


  // 3. Clientes y tablas anidadas
  for (const cliente of clientesData) {
    const { data: cliData, error: errCli } = await supabase.from('clientes').insert({
      id: cliente.id,
      razon_social: cliente.razonSocial,
      cuit: cliente.cuit,
      mail_primario: cliente.mailPrimario,
      mail_secundario: cliente.mailSecundario,
      saldo: cliente.saldo,
      direccion_administrativa: cliente.direccionAdministrativa,
      localidad_admin: cliente.localidadAdmin,
      condicion_fiscal: cliente.condicionFiscal,
      direccion_establecimiento: cliente.direccionEstablecimiento,
      localidad_establecimiento: cliente.localidadEstablecimiento,
      domicilio_fiscal: cliente.domicilioFiscal,
      localidad_fiscal: cliente.localidadFiscal,
      enviar_boletin: cliente.enviarBoletin,
      enviar_novedades: cliente.enviarNovedades
    }).select();

    if (errCli) {
      console.error('Error insertando cliente', cliente.razonSocial, errCli);
      continue;
    }

    // 3a. Contactos
    if (cliente.contactos) {
      for (const contacto of cliente.contactos) {
        await supabase.from('cliente_contactos').insert({
          cliente_id: cliente.id,
          nombre: contacto.nombre,
          apellido: contacto.apellido,
          telefono: contacto.telefono,
          interno: contacto.interno,
          celular: contacto.celular,
          mail: contacto.mail,
          cargo: contacto.cargo,
          obs: contacto.obs
        });
      }
    }

    // 3b. Historia
    if (cliente.historia) {
      for (const hist of cliente.historia) {
        await supabase.from('cliente_historia').insert({
          cliente_id: cliente.id,
          descripcion: hist.descripcion,
          fecha: hist.fecha,
          tipo: hist.tipo
        });
      }
    }

    // 3c. Servicios contratados
    if (cliente.servicios) {
      for (const cs of cliente.servicios) {
        const { data: servData, error: errServ } = await supabase.from('cliente_servicios').insert({
          cliente_id: cliente.id,
          servicio: cs.servicio,
          estado: cs.estado,
          fecha_inicio: cs.fechaInicio,
          fecha_fin: cs.fechaFin,
          usuario_asignado: cs.usuarioAsignado,
          contacto_cliente: cs.contactoCliente,
          contacto_organismo: cs.contactoOrganismo,
          director_tecnico: cs.directorTecnico,
          establecimiento: cs.establecimiento,
          obs_internas: cs.obsInternas
        }).select();
        
        if (errServ) continue;
        
        const csId = servData[0].id;

        // 3d. Actividades del servicio
        if (cs.actividadesCliente) {
          if (cs.actividadesCliente.arca) {
            for (const cod of cs.actividadesCliente.arca) {
              await supabase.from('cliente_servicio_actividades').insert({ cliente_servicio_id: csId, organismo: 'arca', codigo_actividad: cod });
            }
          }
          if (cs.actividadesCliente.ruca) {
            for (const cod of cs.actividadesCliente.ruca) {
              await supabase.from('cliente_servicio_actividades').insert({ cliente_servicio_id: csId, organismo: 'ruca', codigo_actividad: cod });
            }
          }
          if (cs.actividadesCliente.senasa) {
            for (const cod of cs.actividadesCliente.senasa) {
              await supabase.from('cliente_servicio_actividades').insert({ cliente_servicio_id: csId, organismo: 'senasa', codigo_actividad: cod });
            }
          }
        }
      }
    }

    console.log('Migrando Presupuestos...');
  for (const row of budgetRows) {
    await supabase.from('reportes_presupuestos').insert({
      nro_presupuesto: row.nroPresupuesto, cliente: row.cliente, subcompania: row.subcompania,
      usuario_seguimiento: row.usuarioSeguimiento, fecha_creacion: row.fechaCreacion,
      estado_presupuesto: row.estadoPresupuesto, honorario_monto: row.honorarioMonto
    });
  }

  console.log('Migrando Trámites...');
  for (const row of reportConfigs.tramites.rows) {
    await supabase.from('reportes_tramites').insert({
      id: row.id, nombre: row.nombre, nro_expediente: row.nroExpediente,
      nombre_expediente: row.nombreExpediente, fecha_notificacion: row.fechaNotificacion,
      fecha_vto_registro: row.fechaVtoRegistro, estado_presupuesto: row.estadoPresupuesto,
      nro_expediente_sec: row.nroExpedienteSec, nombre_expediente_sec: row.nombreExpedienteSec,
      marca: row.marca, nro_registro: row.nroRegistro, organismo: row.organismo,
      area: row.area, tipo_arancel: row.tipoArancel, monto_arancel: row.montoArancel,
      honorario_monto: row.honorarioMonto, subcompania: row.subcompania, porc_distribucion: row.porcDistribucion
    });
  }

  console.log('Migrando Vencimientos...');
  for (const row of reportConfigs.vencimientos.rows) {
    await supabase.from('reportes_vencimientos').insert({
      id: row.id, razon_social: row.razonSocial, tipo: row.tipo, vencimiento: row.vencimiento,
      nro: row.nro, establecimiento: row.establecimiento, obs: row.obs, usuario: row.usuario
    });
  }

  console.log('Migrando Engordes...');
  for (const row of reportConfigs.engordes.rows) {
    await supabase.from('reportes_engordes').insert({
      id: row.id, renspa: row.renspa, establecimiento: row.establecimiento,
      titular: row.titular, cuit: row.cuit, tipo: row.tipo, provincia: row.provincia,
      partido: row.partido, pertenencia: row.pertenencia, explotacion: row.explotacion,
      latitud: row.latitud, longitud: row.longitud, estado: row.estado
    });
  }

  console.log('Migrando Pedidos Pendientes...');
  for (const row of reportConfigs.pedidosPendientes.rows) {
    await supabase.from('reportes_pedidos_pendientes').insert({
      id: row.id, codigo_cliente: row.codigoCliente, tipo_doc_cliente: row.tipoDocCliente,
      nro_doc_cliente: row.nroDocCliente, email_cliente: row.emailCliente,
      nombre_cliente: row.nombreCliente, pos_fiscal_cliente: row.posFiscalCliente,
      categoria_cliente: row.categoriaCliente, cod_postal_cliente: row.codPostalCliente,
      direccion_cliente: row.direccionCliente, localidad_cliente: row.localidadCliente,
      cod_tipo_venta: row.codTipoVenta, cod_externo: row.codExterno,
      cuit_subcompania: row.cuitSubcompania, fecha: row.fecha, organismo: row.organismo,
      descripcion: row.descripcion, precio_unitario: row.precioUnitario,
      cantidad: row.cantidad, cod_producto: row.codProducto, presupuesto: row.presupuesto,
      expediente: row.expediente, total: row.total, estado: row.estado
    });
  }
  }

  console.log('--- Migración Completada ---');
}

migrarDatos();