import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export function useCatalogos() {
  const [data, setData] = useState({ arca: [], ruca: [], senasa: [], loading: true });

  useEffect(() => {
    async function fetchAll() {
      const [arcaRes, ruca, senasa] = await Promise.all([
        // Modificamos el select de ARCA para traer las relaciones de las tablas puente
        supabase.from('actividades_arca').select(`
          codigo,
          nombre,
          vinculacion_arca_ruca ( ruca_codigo ),
          vinculacion_arca_senasa ( senasa_codigo )
        `),
        supabase.from('actividades_ruca').select('*'),
        supabase.from('actividades_senasa').select('*')
      ]);
      
      const arcaMapeada = (arcaRes.data || []).map(item => ({
        codigo: item.codigo,
        nombre: item.nombre,
        vinculos: {
          ruca: item.vinculacion_arca_ruca ? item.vinculacion_arca_ruca.map(v => v.ruca_codigo) : [],
          senasa: item.vinculacion_arca_senasa ? item.vinculacion_arca_senasa.map(v => v.senasa_codigo) : []
        }
      }));

      setData({
        arca: arcaMapeada,
        ruca: ruca.data || [],
        senasa: senasa.data || [],
        loading: false
      });
    }
    fetchAll();
  }, []);

  return data;
}