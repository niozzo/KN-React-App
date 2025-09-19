/**
 * Interface for Agenda Service
 */

import type { AgendaItem } from '../../types/database';

export interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface IAgendaService {
  getActiveAgendaItems(): Promise<ServiceResult<AgendaItem[]>>;
  refreshAgendaItems(): Promise<ServiceResult<AgendaItem[]>>;
}
