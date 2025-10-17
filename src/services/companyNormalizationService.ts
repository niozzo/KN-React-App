/**
 * Company Normalization Service
 * Story 8.7: Company Name Normalization via Application-Side Transformation
 * 
 * Provides in-memory caching and O(1) lookup for company name normalization.
 * Maps variant company names to canonical standardized company records.
 * 
 * CRITICAL: Uses IN-MEMORY caching only (NOT localStorage) per Story 2.2.4 architecture
 */

import { supabase } from '../lib/supabase';
import { BaseService } from './baseService';
import type { StandardizedCompany } from '../types/standardizedCompany';

/**
 * Company alias mapping from database
 */
interface CompanyAlias {
  id: string;
  alias: string;
  standardized_company_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Company Normalization Service
 * Singleton service for mapping company name variants to canonical names
 */
export class CompanyNormalizationService extends BaseService {
  private static instance: CompanyNormalizationService;
  
  // ✅ CORRECT: In-memory caching via private properties (NOT localStorage)
  private standardizedMap: Map<string, StandardizedCompany> = new Map();
  private aliasMap: Map<string, StandardizedCompany> = new Map();
  private companiesById: Map<string, StandardizedCompany> = new Map();
  
  private constructor() {
    super('CompanyNormalizationService');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): CompanyNormalizationService {
    if (!CompanyNormalizationService.instance) {
      CompanyNormalizationService.instance = new CompanyNormalizationService();
    }
    return CompanyNormalizationService.instance;
  }
  
  /**
   * Initialize the service - load and cache company data
   * Uses localStorage cache populated during login sync
   */
  async initialize(): Promise<void> {
    try {
      const startTime = performance.now();
      
      // Load standardized companies from localStorage cache first
      let companies: StandardizedCompany[] = [];
      try {
        const cachedData = localStorage.getItem('kn_cache_standardized_companies');
        if (cachedData) {
          const cacheObj = JSON.parse(cachedData);
          companies = cacheObj.data || cacheObj;
          console.log('✅ Loaded standardized companies from localStorage cache');
        }
      } catch (cacheError) {
        console.warn('⚠️ Failed to load cached standardized companies:', cacheError);
      }
      
      // Fallback to database if cache is empty
      if (!companies || companies.length === 0) {
        console.log('🌐 No cached companies, fetching from database...');
        const { data: dbCompanies, error: companiesError } = await supabase
          .from('standardized_companies')
          .select('*');
        
        if (companiesError) {
          console.error('❌ Failed to load standardized companies:', companiesError);
          throw new Error(`Failed to load standardized companies: ${companiesError.message}`);
        }
        
        companies = dbCompanies || [];
      }
      
      // Load company aliases from localStorage cache first
      let aliases: CompanyAlias[] = [];
      try {
        const cachedData = localStorage.getItem('kn_cache_company_aliases');
        if (cachedData) {
          const cacheObj = JSON.parse(cachedData);
          aliases = cacheObj.data || cacheObj;
          console.log('✅ Loaded company aliases from localStorage cache');
        }
      } catch (cacheError) {
        console.warn('⚠️ Failed to load cached company aliases:', cacheError);
      }
      
      // Fallback to database if cache is empty
      if (!aliases || aliases.length === 0) {
        console.log('🌐 No cached aliases, fetching from database...');
        const { data: dbAliases, error: aliasesError } = await supabase
          .from('company_aliases')
          .select('*');
        
        if (aliasesError) {
          console.error('❌ Failed to load company aliases:', aliasesError);
          throw new Error(`Failed to load company aliases: ${aliasesError.message}`);
        }
        
        aliases = dbAliases || [];
      }
      
      // Build lookup maps
      this.buildLookupMaps(companies, aliases);
      
      this.isInitialized = true;
      
      const duration = performance.now() - startTime;
      console.log(`✅ Company Normalization Service initialized in ${duration.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ Company Normalization Service initialization failed:', error);
      // Set initialized to false but don't throw - allow graceful degradation
      this.isInitialized = false;
    }
  }
  
  /**
   * Build in-memory lookup maps from loaded data
   */
  private buildLookupMaps(companies: StandardizedCompany[], aliases: CompanyAlias[]): void {
    // Clear existing maps
    this.standardizedMap.clear();
    this.aliasMap.clear();
    this.companiesById.clear();
    
    // Index companies by name (case-insensitive, trimmed)
    companies.forEach(company => {
      const key = company.name.toLowerCase().trim();
      this.standardizedMap.set(key, company);
      this.companiesById.set(company.id, company);
    });
    
    // Index aliases to their standardized companies
    aliases.forEach(alias => {
      const company = this.companiesById.get(alias.standardized_company_id);
      if (company) {
        const key = alias.alias.toLowerCase().trim();
        this.aliasMap.set(key, company);
      } else {
        console.warn(`⚠️ Alias "${alias.alias}" references unknown company ID: ${alias.standardized_company_id}`);
      }
    });
  }
  
  /**
   * Normalize a company name to its standardized form
   * @param input - Company name as entered by user
   * @returns Standardized company object or null if no match found
   */
  normalizeCompanyName(input: string | null | undefined): StandardizedCompany | null {
    if (!input || typeof input !== 'string') {
      return null;
    }
    
    if (!this.isInitialized) {
      console.warn('⚠️ Company Normalization Service not initialized, attempting lazy initialization...');
      // ✅ DEFENSIVE: Attempt lazy initialization as fallback
      this.initialize().catch(error => {
        console.error('❌ Lazy initialization failed:', error);
      });
      return null;
    }
    
    const key = input.toLowerCase().trim();
    
    if (!key) {
      return null;
    }
    
    // Try exact match first
    const exactMatch = this.standardizedMap.get(key);
    if (exactMatch) {
      return exactMatch;
    }
    
    // Try alias match
    const aliasMatch = this.aliasMap.get(key);
    if (aliasMatch) {
      return aliasMatch;
    }
    
    // No match found - return null (graceful fallback)
    return null;
  }
  
  /**
   * Get companies by sector
   * @param sector - Sector to filter by
   * @returns Array of companies in the sector
   */
  getCompanyBySector(sector: string): StandardizedCompany[] {
    if (!this.isInitialized) {
      return [];
    }
    
    const results: StandardizedCompany[] = [];
    this.standardizedMap.forEach(company => {
      if (company.sector === sector) {
        results.push(company);
      }
    });
    
    return results;
  }
  
  /**
   * Get companies by geography
   * @param geography - Geography to filter by
   * @returns Array of companies in the geography
   */
  getCompanyByGeography(geography: string): StandardizedCompany[] {
    if (!this.isInitialized) {
      return [];
    }
    
    const results: StandardizedCompany[] = [];
    this.standardizedMap.forEach(company => {
      if (company.geography === geography) {
        results.push(company);
      }
    });
    
    return results;
  }
  
  /**
   * Refresh the cache by reloading data from the database
   */
  async refreshCache(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }
  
  /**
   * Estimate memory usage of the cache (rough estimate)
   */
  private estimateMemoryUsage(): number {
    // Rough estimate: ~200 bytes per company entry
    const companyCount = this.standardizedMap.size;
    const aliasCount = this.aliasMap.size;
    return Math.round(((companyCount + aliasCount) * 200) / 1024);
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.standardizedMap.clear();
    this.aliasMap.clear();
    this.companiesById.clear();
    this.isInitialized = false;
  }
  
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    initialized: boolean;
    companiesCount: number;
    aliasesCount: number;
    estimatedMemoryKB: number;
  } {
    return {
      initialized: this.isInitialized,
      companiesCount: this.standardizedMap.size,
      aliasesCount: this.aliasMap.size,
      estimatedMemoryKB: this.estimateMemoryUsage()
    };
  }
}

// Export singleton instance for convenience
export const companyNormalizationService = CompanyNormalizationService.getInstance();

