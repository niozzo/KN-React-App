/**
 * Agenda Data Hook
 * Story 2.1f2: Data Loading Hook
 * 
 * Specialized hook for loading agenda data with caching
 */

import { useCallback } from 'react';
import { useDataLoading } from './useDataLoading';
import { agendaService } from '../services/agendaService';
import type { PaginatedResponse, AgendaItem } from '../types/database';

export const useAgendaData = () => {
  const { data, loading, error, loadData, refresh, clearCache } = useDataLoading<PaginatedResponse<AgendaItem>>();

  const loadAgendaItems = useCallback(async () => {
    return loadData(
      'kn_cache_agenda_items',
      () => agendaService.getActiveAgendaItems(),
      { ttl: 5 * 60 * 1000 } // 5 minutes
    );
  }, [loadData]);

  const refreshAgendaItems = useCallback(async () => {
    return refresh(
      'kn_cache_agenda_items',
      () => agendaService.getActiveAgendaItems(),
      { ttl: 5 * 60 * 1000 }
    );
  }, [refresh]);

  const clearAgendaCache = useCallback(async () => {
    return clearCache('kn_cache_agenda_items');
  }, [clearCache]);

  return {
    agendaData: data,
    loading,
    error,
    loadAgendaItems,
    refreshAgendaItems,
    clearAgendaCache
  };
};
