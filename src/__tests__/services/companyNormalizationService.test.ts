/**
 * CompanyNormalizationService Tests
 * Story 8.7: Company Name Normalization via Application-Side Transformation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompanyNormalizationService } from '../../services/companyNormalizationService';
import type { StandardizedCompany } from '../../types/standardizedCompany';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('CompanyNormalizationService - Essential Tests', () => {
  let service: CompanyNormalizationService;
  
  const mockStandardizedCompanies: StandardizedCompany[] = [
    {
      id: '1',
      name: 'Accordion',
      sector: 'Vendors/Sponsors',
      geography: 'US',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Apax Partners',
      sector: 'Vendors/Sponsors',
      geography: 'Global',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ];
  
  const mockAliases = [
    { id: 'a1', alias: 'Apax', standardized_company_id: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset singleton
    // @ts-ignore
    CompanyNormalizationService.instance = undefined;
    
    service = CompanyNormalizationService.getInstance();
    
    // Mock Supabase responses
    const { supabase } = await import('../../lib/supabase');
    const fromMock = vi.fn();
    (supabase.from as any) = fromMock;
    
    fromMock.mockImplementation((table: string) => {
      if (table === 'standardized_companies') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockStandardizedCompanies,
            error: null
          })
        };
      } else if (table === 'company_aliases') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockAliases,
            error: null
          })
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });
    
    await service.initialize();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize and cache company data', async () => {
    const stats = service.getCacheStats();
    
    expect(stats.initialized).toBe(true);
    expect(stats.companiesCount).toBe(2);
    expect(stats.aliasesCount).toBe(1);
  });

  it('should find exact match (case-insensitive, trimmed)', () => {
    expect(service.normalizeCompanyName('Accordion')?.name).toBe('Accordion');
    expect(service.normalizeCompanyName('ACCORDION')?.name).toBe('Accordion');
    expect(service.normalizeCompanyName('  Accordion  ')?.name).toBe('Accordion');
  });

  it('should map alias to canonical name', () => {
    const result = service.normalizeCompanyName('Apax');
    
    expect(result?.name).toBe('Apax Partners');
    expect(result?.sector).toBe('Vendors/Sponsors');
  });

  it('should return null for unmatched companies and invalid input', () => {
    expect(service.normalizeCompanyName('Oracle')).toBeNull();
    expect(service.normalizeCompanyName('')).toBeNull();
    expect(service.normalizeCompanyName(null as any)).toBeNull();
    expect(service.normalizeCompanyName(undefined as any)).toBeNull();
  });

  it('should NOT write to localStorage (in-memory only)', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    
    // @ts-ignore
    CompanyNormalizationService.instance = undefined;
    const freshService = CompanyNormalizationService.getInstance();
    await freshService.initialize();
    
    // Perform lookups
    freshService.normalizeCompanyName('Apax');
    freshService.normalizeCompanyName('Accordion');
    
    // Verify no localStorage writes
    expect(setItemSpy).not.toHaveBeenCalled();
    
    setItemSpy.mockRestore();
  });

  it('should meet performance requirements (<1ms lookup)', () => {
    const iterations = 100;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      service.normalizeCompanyName('Apax Partners');
    }
    
    const avgTime = (performance.now() - startTime) / iterations;
    expect(avgTime).toBeLessThan(1);
  });

  it('should handle initialization failure gracefully', async () => {
    // @ts-ignore
    CompanyNormalizationService.instance = undefined;
    const failService = CompanyNormalizationService.getInstance();
    
    // Mock error
    const { supabase } = await import('../../lib/supabase');
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
    }));
    
    await failService.initialize();
    
    // Should not crash, returns null
    expect(failService.normalizeCompanyName('Apax')).toBeNull();
  });

  it('should contain no confidential fields in company data', () => {
    const result = service.normalizeCompanyName('Apax Partners');
    
    // Verify NO confidential fields
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phone');
    expect(result).not.toHaveProperty('access_code');
    
    // Verify safe fields only
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('sector');
  });
});
