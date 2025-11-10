'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import type { CategoryWithFoods } from '@/lib/api-types';

/**
 * Hook per ottenere tutte le categorie con i cibi raggruppati
 * Esegue una singola query: GET /v1/foods?include=ingredients&group_by=category
 * Restituisce le categorie con i cibi già raggruppati dentro
 */
export function useCategoriesWithFoods() {
  const [data, setData] = useState<CategoryWithFoods[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await apiClient.get<CategoryWithFoods[]>(
          '/v1/foods?include=ingredients&group_by=category'
        );
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, isLoading, error };
}
