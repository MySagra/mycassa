'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import type { Category, Food } from '@/lib/api-types';

// Hook per ottenere tutte le categorie disponibili
export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const response = await apiClient.get<Category[]>('/v1/categories/available');
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return { data, isLoading, error };
}

// Hook per ottenere cibi per categoria (null = tutti i cibi)
export function useFoodsByCategory(categoryId: number | null) {
  const [data, setData] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchFoods() {
      try {
        setIsLoading(true);
        let response;
        if (categoryId === null) {
          response = await apiClient.get<Food[]>('/v1/foods/available');
        } else {
          response = await apiClient.get<Food[]>(
            `/v1/foods/available/categories/${categoryId}`
          );
        }
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFoods();
  }, [categoryId]);

  return { data, isLoading, error };
}
