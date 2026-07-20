const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, TableOfContents, PageBreak,
  LevelFormat, VerticalAlign
} = require("docx");
const fs = require("fs");

// ---------- helpers ----------
const NORMAL = 22; // 11pt
const GRAY = "444444";
const ACCENT = "1F4E5F";
const LIGHT = "DCE6E9";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 30 })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 26 })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, italics: true, size: 23 })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 300 },
    alignment: opts.justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    children: [new TextRun({ text, size: NORMAL, bold: !!opts.bold, italics: !!opts.italics })],
  });
}
function pMulti(runs, opts = {}) {
  // runs: array of {text, bold, italics}
  return new Paragraph({
    spacing: { after: 160, line: 300 },
    alignment: opts.justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    children: runs.map(r => new TextRun({ text: r.text, size: NORMAL, bold: !!r.bold, italics: !!r.italics })),
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullet-list", level: 0 },
    spacing: { after: 100, line: 300 },
    children: [new TextRun({ text, size: NORMAL, bold: !!opts.bold, italics: !!opts.italics })],
  });
}
function callout(text) {
  return new Paragraph({
    spacing: { before: 120, after: 200, line: 300 },
    border: { left: { color: ACCENT, space: 8, style: BorderStyle.SINGLE, size: 18 } },
    indent: { left: 200 },
    children: [new TextRun({ text, size: NORMAL, italics: true, color: GRAY })],
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, color: "auto", fill: ACCENT } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20, bold: !!opts.header, color: opts.header ? "FFFFFF" : "000000" })],
    })],
  });
}
function table(headers, rows, widths) {
  const w = widths || headers.map(() => Math.floor(9350 / headers.length));
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: w,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((hd, i) => cell(hd, { header: true, width: w[i] })),
      }),
      ...rows.map(r => new TableRow({
        children: r.map((c, i) => cell(c, { width: w[i] })),
      })),
    ],
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ---------- document ----------
const children = [];

// PORTADA
children.push(
  new Paragraph({ spacing: { before: 1600 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "UNIVERSIDAD TECNOLÓGICA NACIONAL", bold: true, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Facultad Regional Rosario — Ingeniería en Sistemas de Información", size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 },
    children: [new TextRun({ text: "Administración Gerencial", size: 22, italics: true })] }),
  new Paragraph({ spacing: { before: 1000 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "SIMULACIÓN DE EXAMEN", bold: true, size: 40, color: ACCENT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 },
    children: [new TextRun({ text: "Proceso de Implementación–Apropiación de Tecnología", bold: true, size: 30 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 },
    children: [new TextRun({ text: "Caso: Cerealex S.A.", bold: true, size: 26, italics: true })] }),
  new Paragraph({ spacing: { before: 1400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Basado en la ficha de cátedra de Hernán Cornejo", size: 20, color: GRAY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Julio de 2026", size: 20, color: GRAY })] }),
  pageBreak()
);

// INDICE
children.push(h1("Índice"));
children.push(new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-3" }));
children.push(pageBreak());

// ============ 0. Nota metodológica ============
children.push(h1("Nota metodológica"));
children.push(p("La siguiente simulación construye un caso ficticio de una empresa argentina que atraviesa un proceso completo de implementación-apropiación de tecnología, siguiendo el esquema conceptual de la ficha de cátedra de Hernán Cornejo. Cada sección hace referencia explícita al concepto teórico que ilustra, para poder justificar oralmente cada decisión del caso el día del examen. Se hizo especial foco en dos ejes que se solicitaron profundizar: la gestión del cambio y el mapeo del conocimiento experto, sin dejar de desarrollar el resto de las etapas del proceso.", { justify: true }));

// ============ 1. La empresa y el contexto estratégico ============
children.push(h1("1. La empresa y el contexto estratégico"));

children.push(h2("1.1. Perfil de la organización"));
children.push(p("Cerealex S.A. es una empresa agroindustrial fundada en 1978 en Rosario por la familia Ferretti. Se dedica al acopio, procesamiento (extracción de aceite y harinas proteicas) y exportación de soja, maíz y trigo. Cuenta con dos plantas industriales en el cordón industrial rosarino (Puerto General San Martín y Timbúes) y un centro de acopio en Pergamino, provincia de Buenos Aires. Su casa administrativa central está en Rosario y emplea a 1.380 personas. Exporta principalmente a Brasil y a la Unión Europea. El Directorio está presidido por Marcelo Ferretti, hijo del fundador (fallecido en 2023), y sus dos hermanas son accionistas con participación minoritaria.", { justify: true }));

children.push(h2("1.2. La definición de la estrategia corporativa (el disparador)"));
children.push(p("En 2026 el Directorio aprueba el Plan Estratégico 2026-2031, cuyo eje central es: “consolidar a Cerealex como proveedor confiable de granos y subproductos certificados, abriendo el mercado asiático (China y Vietnam) mediante trazabilidad integral de campo a puerto”. Esta definición estratégica es el punto de partida correcto según la ficha de cátedra: primero se define el rumbo de negocio y recién a partir de allí se releva qué información de calidad hace falta para sostenerlo.", { justify: true }));
children.push(callout("Aplicación del concepto: la cadena lógica “estrategia corporativa → información de calidad → estrategia de sistemas de información → tecnología” arranca acá. El mercado asiático exige trazabilidad certificada (origen del grano, tratamientos fitosanitarios, cadena de custodia), lo que se traduce en una demanda concreta de información integrada entre Producción, Logística, Comercial y Calidad."));

children.push(h2("1.3. La situación previa: “islotes de información” y el gerente apagafuegos"));
children.push(p("Antes del Plan Estratégico, Cerealex reflejaba exactamente el escenario que describe la sección “La realidad de las definiciones” de la ficha: cada área había resuelto sus urgencias por separado. Comercial llevaba el seguimiento de exportaciones en planillas Excel personales; Producción usaba un sistema legado del año 2003 que nadie se animaba a tocar; el control de camiones e ingreso de granos en Puerto General San Martín se hacía en papel y se cargaba manualmente al día siguiente; RRHH tenía un sistema de liquidación de haberes aislado del resto.", { justify: true }));
children.push(p("El responsable de Sistemas, Nicolás Bettini (Ingeniero en Sistemas, 8 años en la empresa), pasaba la enorme mayoría de su tiempo resolviendo incidentes de soporte técnico —impresoras, redes, planillas rotas— y muy poco tiempo pensando la información de forma integrada. Esta es la figura que la ficha describe como el profesional atrapado en el rol de soporte, lejos del ideal druckeriano del “analista simbólico”: alguien que interpreta las demandas de información de toda la organización de forma integrada y con competencias tanto técnicas como de liderazgo, comunicación y negociación.", { justify: true }));
children.push(callout("Aplicación del concepto: los “islotes de información” de Cerealex (Excel comercial, sistema legado de Producción, papel en Logística, sistema aislado de RRHH) son el ejemplo textual de aplicaciones de uso local que resuelven un problema puntual pero que están “lo más alejado posible de la integración”."));

// ============ 2. Del soporte técnico al analista simbólico ============
children.push(h1("2. De “apagar incendios” a analista simbólico: el proceso de negociación"));

children.push(h2("2.1. El dilema inicial"));
children.push(p("Cuando el Directorio comunica el Plan Estratégico, Bettini enfrenta el dilema que plantea la ficha: seguir siendo el eterno apagador de incendios bajo las distintas coyunturas, o intentar darle un sentido estratégico y planificado a su práctica. Bettini decide asumir el desafío, pero es consciente de que esto no depende solo de su voluntad individual: necesita que la organización —empezando por su jefa directa, la Directora de Operaciones— tome conciencia real del problema.", { justify: true }));

children.push(h2("2.2. El proceso de negociación con la alta dirección"));
children.push(p("Bettini solicita una reunión con Valeria Suárez, Directora de Operaciones, y le plantea que la información dispersa actual no puede sostener el objetivo de trazabilidad “de campo a puerto” que exige el Plan Estratégico. Suárez, convencida por el argumento, acepta oficiar de sponsor del proyecto ante el Directorio: será quien gestione los recursos al más alto nivel y quien integre el futuro Comité de Proyecto.", { justify: true }));
children.push(p("Este paso es crítico porque, como señala la ficha, las sucesivas circunstancias en que la gestión de la información dificulta la tarea de las gerencias pueden leerse como una debilidad del profesional a cargo, y no como un problema estructural de la organización; contar con un sponsor de alto nivel que respalde el enfoque integral protege a Bettini de ese riesgo.", { justify: true }));

children.push(h2("2.3. La doble carga: sostener el día a día y construir la propuesta"));
children.push(p("Bettini enfrenta la dificultad concreta que anticipa la ficha: no puede descuidar el soporte operativo (si la gestión cotidiana falla, corre riesgo su continuidad en la empresa) mientras arma la propuesta integral. Resuelve esto delegando la gestión rutinaria en su analista senior, confiando en su criterio para las decisiones operativas del día a día, mientras él dedica dos días por semana a relevar la información estratégica junto a los gerentes de área. Esta delegación es posible porque Bettini conoce en profundidad las competencias y el compromiso de su equipo, condición que la ficha marca como fundamental para un liderazgo real.", { justify: true }));

// ============ 3. Relevamiento y definición de la tecnología ============
children.push(h1("3. Relevamiento estratégico y definición de la tecnología"));

children.push(h2("3.1. Relevamiento top-down con la coalición directiva real"));
children.push(p("Siguiendo el método propuesto por la ficha, Bettini releva primero la visión de los ejecutivos de mayor nivel —la Directora de Operaciones, el Gerente Comercial, la Gerente de Producción, el Gerente de Logística, el Gerente de Finanzas y la Gerente de RRHH— antes de bajar a los procesos particulares de cada módulo. El relevamiento se planifica con un horizonte de 5 años, coincidente con el Plan Estratégico.", { justify: true }));
children.push(callout("Riesgo señalado por la ficha y presente en el caso: Cerealex es una empresa familiar en segunda generación, con dos hermanas accionistas minoritarias. Si durante el proyecto una de ellas decidiera vender su participación, cambiaría la distribución de poder real del Directorio. El equipo de proyecto identifica este riesgo desde el inicio y decide anclar el relevamiento en la coalición directiva vigente al momento de la aprobación del Plan Estratégico, documentando por escrito los lineamientos acordados para minimizar el impacto de un eventual cambio accionario."));

children.push(h2("3.2. El rechazo al “farmacéutico de software”"));
children.push(p("A los pocos días de conocerse el proyecto, un proveedor (Quantum Software, ficticio) se presenta ofreciendo un ERP “genérico para agroindustria” en base a dos intercambios de mails con Bettini, sin ningún relevamiento real de la operación de Cerealex. Bettini rechaza la propuesta explícitamente citando el riesgo que describe la ficha: definir la tecnología sin relevar antes la información de calidad necesaria es como el farmacéutico que vende remedios sin diagnosticar. La decisión se comunica al Comité de Proyecto como un criterio de selección de proveedores.", { justify: true }));

children.push(h2("3.3. La matriz de requerimientos"));
children.push(p("Con la información relevada, el equipo construye la matriz de requerimientos, documento que luego será la base de la licitación. Un extracto simplificado:", { justify: true }));
children.push(table(
  ["Área / módulo", "Proceso de negocio", "Requerimiento de información", "Nivel de decisión", "Prioridad"],
  [
    ["Comercial", "Exportación de granos", "Trazabilidad de origen por lote y contrato de venta", "Estratégico", "Alta"],
    ["Producción", "Extracción de aceite y harinas", "Registro de parámetros de proceso por lote", "Táctico", "Alta"],
    ["Logística", "Ingreso y pesaje de camiones", "Trazabilidad de camión, chofer y origen del grano", "Operativo", "Alta"],
    ["Finanzas", "Comercio exterior", "Conciliación de cobros en moneda extranjera por planta", "Táctico", "Media"],
    ["RRHH", "Gestión de personal multi-convenio", "Liquidación integrada con costos por planta", "Operativo", "Media"],
  ],
  [1600, 2200, 2900, 1550, 1100]
));
children.push(callout("Aplicación del concepto: cualquier ambigüedad en esta matriz —por ejemplo, no definir con precisión qué se entiende por “trazabilidad de origen”— se traduce después, según advierte la ficha, en discusiones entre los actores, renegociaciones y retrasos del proyecto."));

children.push(h2("3.4. El proceso de licitación"));
children.push(p("Con la matriz de requerimientos cerrada, Cerealex cotiza la solución con tres empresas: SAP, Oracle y un ERP local (Nexus, ficticio). Se evalúa punto por punto lo que cada una ofrece frente a la matriz. Se selecciona SAP, principalmente porque su partner certificado en la región —Bridge Consulting (ficticia)— acredita casos de éxito de trazabilidad en agroindustria, y porque Bridge propone además a la consultora Praxis Cambio Organizacional (ficticia) para acompañar los aspectos de gestión del cambio.", { justify: true }));

children.push(h2("3.5. El equipo de proyecto"));
children.push(table(
  ["Rol", "Persona / entidad", "Función"],
  [
    ["Sponsor", "Valeria Suárez — Directora de Operaciones", "Gestiona recursos al más alto nivel; preside el Comité de Proyecto"],
    ["Gerente de Proyecto", "Nicolás Bettini — Gerente de Sistemas", "Máximo responsable de la gestión día a día del proyecto"],
    ["Líder de Proyecto (Comercial)", "Diego Palacios — Gerente Comercial", "Aporta experticia en exportación y contratos"],
    ["Líder de Proyecto (Producción)", "Ana Klein — Gerente de Producción", "Aporta experticia en procesos de planta"],
    ["Líder de Proyecto (Logística)", "Martín Souto — Gerente de Logística", "Aporta experticia en trazabilidad de camiones"],
    ["Líder de Proyecto (Finanzas)", "Julián Roig — Gerente de Finanzas", "Aporta experticia en comercio exterior"],
    ["Líder de Proyecto (RRHH)", "Carolina Ibáñez — Gerente de RRHH", "Aporta experticia en convenios colectivos"],
    ["Consultora tecnológica (partner)", "Bridge Consulting", "Implementa técnicamente los módulos de SAP"],
    ["Consultora de gestión del cambio", "Praxis Cambio Organizacional", "Trabaja resistencias y mide clima organizacional"],
  ],
  [2600, 2900, 3850]
));

children.push(pageBreak());

// ============ 4. MAPEO DEL CONOCIMIENTO EXPERTO (foco central) ============
children.push(h1("4. Mapeo del conocimiento experto"));
children.push(p("Este es uno de los dos ejes centrales solicitados para la simulación. El mapeo de conocimiento experto es el mecanismo por el cual Cerealex identifica quiénes, dentro de la organización, poseen el conocimiento crítico necesario para adecuar los módulos del sistema a la realidad operativa de la empresa.", { justify: true }));

children.push(h2("4.1. Metodología de mapeo"));
children.push(p("El equipo de proyecto, liderado por Bettini junto a cada Líder de Proyecto, releva para cada área quiénes son los referentes de mayor experiencia y capacidad en relación a las funciones o módulos involucrados (comercial, producción, logística, finanzas, RRHH), siguiendo cuatro criterios:", { justify: true }));
children.push(bullet("Antigüedad y trayectoria en el proceso específico."));
children.push(bullet("Profundidad del conocimiento tácito (procedimientos no escritos, excepciones, atajos operativos reales)."));
children.push(bullet("Capacidad de transferencia: si puede explicar y enseñar lo que sabe, no solo ejecutarlo."));
children.push(bullet("Criticidad del rol: qué tan grave sería para la organización perder ese conocimiento sin un reemplazo formado."));

children.push(h2("4.2. Resultados del mapeo: usuarios clave"));
children.push(p("Los usuarios clave son quienes, junto a los consultores tecnológicos de Bridge Consulting, adecuarán los procesos de Cerealex a los módulos adquiridos de SAP:", { justify: true }));
children.push(table(
  ["Nombre", "Área", "Antigüedad", "Conocimiento crítico que posee", "Riesgo si no se documenta"],
  [
    ["Lucía Nardi", "Comercial / Exportaciones", "15 años", "Maneja de memoria las excepciones aduaneras por destino y contrato", "Alto: es la única que resuelve casos atípicos de exportación"],
    ["Hugo Bianchi", "Producción — Jefe de Planta Timbúes", "22 años", "Domina el detalle técnico del proceso de extracción necesario para parametrizar el módulo", "Muy alto: próximo a jubilarse en 2 años"],
    ["Rosa Medina", "Logística — Balanza Puerto Gral. San Martín", "18 años", "Conoce el circuito real de ingreso de camiones, distinto del procedimiento formal del manual de calidad", "Alto: ese circuito real nunca fue documentado"],
    ["Emilio Casals", "Finanzas — Tesorería y comercio exterior", "10 años", "Maneja coberturas y conciliaciones en moneda extranjera multi-planta", "Medio"],
    ["Paula Fontana", "RRHH — Liquidación de haberes", "8 años", "Conoce las particularidades de los convenios colectivos (aceitero, camioneros)", "Medio"],
  ],
  [1300, 1900, 1150, 3300, 1700]
));

children.push(h2("4.3. Usuarios críticos y usuarios finales"));
children.push(p("Debajo de cada usuario clave se identifica un usuario crítico —experimentado en el uso cotidiano, que participará en las definiciones y luego transferirá su experiencia a los usuarios finales de cada planta u oficina—: Braian Suárez (Comercial), Karina Do Santos (Producción), Iván Correa (Logística), Melina Aguirre (Finanzas) y Federico Lucero (RRHH). Los usuarios finales son el personal administrativo y operativo de cada planta que realiza el ingreso de datos, las búsquedas y los filtros simples del día a día.", { justify: true }));
children.push(callout("Aplicación del concepto: se trabaja explícitamente el cambio de filosofía que marca la ficha, de pensar en “usuarios” a pensar en “clientes internos” —sujetos con aspectos personales y grupales propios, no meros ejecutores acríticos del sistema—. Esto se traduce en talleres de escucha previos a la definición de procesos, donde Praxis Cambio Organizacional relevó expectativas y temores antes de sentar a estas personas a rediseñar su propio proceso de trabajo."));

children.push(h2("4.4. El riesgo de sucesión como hallazgo del mapeo"));
children.push(p("El mapeo revela un hallazgo crítico: Hugo Bianchi, el único con el conocimiento técnico necesario para parametrizar el módulo de Producción, se jubila en dos años. Sin este proyecto, ese conocimiento se hubiera perdido sin documentar. El Comité de Proyecto decide entonces que la etapa de definición de procesos de Producción no solo sirva para configurar SAP, sino que se use como instancia formal de transferencia de conocimiento hacia Karina Do Santos, su usuaria crítica, quien queda así en condiciones de sucederlo.", { justify: true }));

// ============ 5. GESTIÓN DEL CAMBIO (foco central) ============
children.push(pageBreak());
children.push(h1("5. Gestión del cambio"));
children.push(p("Este es el segundo eje central solicitado. La gestión del cambio en Cerealex está a cargo de Praxis Cambio Organizacional, trabajando codo a codo con Bettini y con Suárez en el Comité de Proyecto.", { justify: true }));

children.push(h2("5.1. Diagnóstico de clima organizacional pre-implementación"));
children.push(p("Antes de arrancar la definición de procesos, Praxis realiza una encuesta de clima organizacional en las tres plantas y la casa central. Los resultados muestran que el 62% del personal percibe el proyecto como una amenaza (principalmente por temor a la pérdida de puestos o de protagonismo), y que la principal fuente de ansiedad es la falta de información clara sobre qué va a cambiar en el trabajo cotidiano de cada uno.", { justify: true }));

children.push(h2("5.2. Plan de comunicación y timing"));
children.push(p("Siguiendo el criterio de la ficha —decir lo correcto y justo, en el momento justo, a quien corresponda—, el Comité de Proyecto arma un cronograma de comunicación y convocatorias que respeta los momentos críticos de cada área del negocio agroindustrial:", { justify: true }));
children.push(bullet("Se evita convocar a los referentes de Producción y Logística durante la cosecha gruesa (marzo–mayo), el período de mayor volumen de recepción de camiones y molienda del año."));
children.push(bullet("Se evita convocar al equipo de RRHH durante la semana de liquidación mensual de haberes."));
children.push(bullet("Se planifica el kick-off institucional para junio, una vez pasado el pico estacional, con la presencia del Presidente del Directorio y de Suárez como sponsor, comunicando propósitos, objetivos, formas de trabajo y exigencias de participación del proyecto a todo el personal convocado."));

children.push(h2("5.3. Gestión de resistencias en los tres niveles"));
children.push(p("Praxis identifica y trabaja resistencias en los tres niveles que menciona la ficha:", { justify: true }));
children.push(bullet("Nivel organizacional: resistencia cultural general a abandonar las planillas Excel y los procedimientos informales que, aunque ineficientes, daban a cada área un control percibido sobre su propia información."));
children.push(bullet("Nivel grupal: el equipo de Logística de Puerto General San Martín percibe el nuevo módulo de trazabilidad como una pérdida de autonomía histórica sobre el control de camiones, generando reticencia grupal a compartir el procedimiento real (no el del manual) con los consultores."));
children.push(bullet("Nivel individual: el jefe de turno de la planta de Timbúes se niega inicialmente a liberar a su mejor operario para las reuniones de definición, por temor a perder protagonismo frente a la gerencia."));
children.push(p("El caso del jefe de turno de Timbúes reproduce exactamente el mecanismo que describe la ficha: al no resolverse en la negociación directa, Bettini escala el problema al sponsor, Valeria Suárez, quien lo resuelve reservando desde el Comité de Proyecto un procedimiento formal para liberar personal clave sin afectar la operación diaria.", { justify: true }));

children.push(h2("5.4. Compromiso visible de la alta gerencia"));
children.push(p("El apoyo del Directorio se sostiene con mensajes periódicos de Marcelo Ferretti en los town halls y con la presencia de Suárez en cada hito relevante del proyecto. Este compromiso visible es, según marca la ficha, condición necesaria para conseguir la colaboración de las gerencias de línea, que de otro modo seguirían viendo al área de Sistemas solo como un soporte operativo sin peso estratégico.", { justify: true }));

children.push(h2("5.5. Medición de clima durante y después de la implementación"));
children.push(p("Praxis repite la encuesta de clima a mitad del proyecto (tras el kick-off y las primeras capacitaciones) y a los seis meses de la puesta en marcha. Los rumores y la percepción de amenaza bajan de forma sostenida: la ansiedad inicial se reduce notablemente después del kick-off, y a los seis meses de uso el sistema es percibido como una herramienta útil por la gran mayoría del personal encuestado. Estos resultados se usan para decidir, junto al Comité de Proyecto, dónde reforzar la comunicación y el acompañamiento en cada etapa siguiente.", { justify: true }));

// ============ 6. Primeras interacciones ============
children.push(pageBreak());
children.push(h1("6. Primeras interacciones y planificación fina"));
children.push(p("Definidos los actores (Cerealex, Bridge Consulting y Praxis), se realizan reuniones de conocimiento mutuo y se pone en consideración la planificación fina del proyecto: actividades, tiempos, intervenciones y equipos que participan en cada módulo. A partir de acá se comunica formalmente a los responsables de los grupos de usuarios clave y críticos su participación en el proyecto, ya con el mapeo de conocimiento del capítulo 4 como base para saber, con precisión, a quién convocar en cada instancia.", { justify: true }));

// ============ 7. Capacitación de los módulos ============
children.push(h1("7. Capacitación de los módulos"));
children.push(h2("7.1. Logística de la capacitación"));
children.push(p("SAP habilita licencias por máquina con cupos limitados en su centro de capacitación regional de Buenos Aires, condicionados a la demanda global de proyectos en curso en ese momento. Bettini gestiona con varios meses de anticipación los turnos para los líderes y usuarios clave, y el área de Administración organiza pasajes, hotel y viáticos para quienes viajan desde Timbúes, Puerto General San Martín y Pergamino.", { justify: true }));

children.push(h2("7.2. Negociación de la liberación de personal clave"));
children.push(p("Tal como se anticipó en la gestión del cambio, la planificación evita las semanas de cosecha gruesa y de liquidación de haberes. Aun así, aparece resistencia puntual de superiores de línea a liberar varios días a su personal más experimentado (el caso de Timbúes ya descripto); cuando la negociación directa no alcanza, se apela al sponsor y queda definido un procedimiento en el Comité de Proyecto para estos casos.", { justify: true }));

children.push(h2("7.3. La barrera del idioma y los materiales traducidos"));
children.push(p("La capacitación de los módulos de SAP se dicta en inglés, lo que genera tensión entre los colaboradores de planta que no dominan el idioma —particularmente Hugo Bianchi y Rosa Medina—. Bridge Consulting provee, bajo su propia responsabilidad, manuales traducidos al español para cada módulo, ya que la desarrolladora no se responsabiliza legalmente por errores de traducción de procedimientos.", { justify: true }));

children.push(h2("7.4. El desgaste procedimental y el ajuste pedagógico"));
children.push(p("Las capacitaciones, muy procedimentales (pantalla por pantalla del sistema), generan cansancio y la sensación de “estar conociendo iconitos y no trabajando realmente”, sobre todo entre los usuarios críticos de Logística. Praxis recoge estas impresiones día a día y, en consenso con Bridge Consulting, ajusta el estilo de las últimas jornadas incorporando más ejercicios integradores con casos reales de Cerealex (por ejemplo, simular el ingreso de un camión real de la campaña anterior) en lugar de únicamente recorrer opciones de menú.", { justify: true }));

// ============ 8. Dificultades ============
children.push(pageBreak());
children.push(h1("8. Dificultades enfrentadas durante el proceso"));
children.push(p("Siguiendo la enumeración de la ficha de cátedra, estas son las cinco dificultades que efectivamente atravesó el proyecto en Cerealex:", { justify: true }));
children.push(table(
  ["Dificultad (según la ficha)", "Cómo se manifestó en Cerealex", "Resolución"],
  [
    ["Definición coyuntural sin lineamientos estratégicos", "Logística pidió inicialmente “una app para pesar camiones más rápido”, ignorando el objetivo de trazabilidad", "Bettini redirigió el pedido hacia la matriz de requerimientos general"],
    ["Falta de presencia de colaboradores clave", "Hugo Bianchi no podía participar durante la molienda pico de marzo-mayo", "Se replanificó su participación para junio-julio"],
    ["Problemas en la gestión integral del proyecto", "Bridge Consulting subestimó las horas del módulo de Producción", "Bettini reasignó recursos y renegoció el cronograma con el partner"],
    ["Conflictos por interpretación de la matriz de requerimientos", "Finanzas y Comercial discreparon sobre quién definía el tipo de cambio en conciliaciones de exportación", "Se resolvió por escrito en el Comité de Proyecto"],
    ["Interrupciones imprevistas", "Un paro del transporte de granos obligó a posponer dos semanas las reuniones con Logística", "Se reprogramaron sin afectar el cronograma de capacitación ya reservado"],
  ],
  [2900, 3400, 3050]
));

// ============ 9. Resultados ============
children.push(pageBreak());
children.push(h1("9. Resultados de la implementación"));

children.push(h2("9.1. Resultados de la gestión del cambio"));
children.push(p("La adopción del sistema por parte de los usuarios finales fue alta a los seis meses de la puesta en marcha, con una percepción de utilidad claramente superior a la registrada en el diagnóstico inicial. El seguimiento de clima organizacional muestra una curva de ansiedad que baja de forma sostenida desde el kick-off hasta la etapa de uso estable, validando el plan de comunicación y el trabajo de acompañamiento de Praxis Cambio Organizacional.", { justify: true }));

children.push(h2("9.2. Resultados del mapeo del conocimiento"));
children.push(p("El trabajo de definición de procesos, usado también como instancia de transferencia, permitió documentar por primera vez el conocimiento tácito de Hugo Bianchi y Rosa Medina en manuales internos co-escritos con Karina Do Santos e Iván Correa. Esto redujo de forma directa el riesgo de pérdida de conocimiento crítico que el mapeo había identificado, particularmente ante la jubilación próxima de Bianchi.", { justify: true }));

children.push(h2("9.3. Resultados de negocio"));
children.push(p("Cerealex logró habilitar la trazabilidad “de campo a puerto” exigida por el Plan Estratégico, obtuvo la certificación correspondiente ante SENASA y concretó su primera exportación a Vietnam a los catorce meses del kick-off. La conciliación financiera multi-planta, antes manual y dispersa entre planillas, pasó a resolverse de forma integrada entre Finanzas y Comercial dentro del mismo sistema.", { justify: true }));

children.push(h2("9.4. Conclusión conceptual"));
children.push(p("El caso Cerealex confirma la tesis central de la ficha de cátedra: el factor crítico de éxito no fue la elección de SAP por sobre Oracle o Nexus, sino la secuencia completa que la precedió y la acompañó —la definición estratégica previa, una matriz de requerimientos construida sobre un relevamiento real y top-down, un mapeo de conocimiento experto que identificó y protegió el saber tácito de la organización, y una gestión del cambio que trabajó las resistencias en los tres niveles (organizacional, grupal e individual) con un timing cuidadoso de la comunicación. Sin esa base, Cerealex hubiera terminado, como advierte la ficha, automatizando su presente sin sistematizar su futuro.", { justify: true }));

// ---------- build ----------
const doc = new Document({
  creator: "Sere",
  title: "Simulación Cerealex S.A. — Proceso de Implementación-Apropiación de Tecnología",
  features: { updateFields: true },
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      },
    ],
  },
  sections: [
    {
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      children,
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/claude/simulacion/Simulacion_Cerealex_ImplementacionApropiacion.docx", buf);
  console.log("listo");
});
