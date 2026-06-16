// src/data/serviciosDB.js
export const initialServicios = [
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