import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export function useCatalogos() {
  const [data, setData] = useState({ arca: [], ruca: [], senasa: [], loading: true });

  useEffect(() => {
    async function fetchAll() {
      const [arca, ruca, senasa] = await Promise.all([
        supabase.from('actividades_arca').select('*'),
        supabase.from('actividades_ruca').select('*'),
        supabase.from('actividades_senasa').select('*')
      ]);
      
      setData({
        arca: arca.data || [],
        ruca: ruca.data || [],
        senasa: senasa.data || [],
        loading: false
      });
    }
    fetchAll();
  }, []);

  return data;
}