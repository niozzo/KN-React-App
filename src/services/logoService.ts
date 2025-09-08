// Logo Management Service
// Handles automatic logo fetching from multiple sources

import { LogoFetchResponse, LogoSource } from '../types/sponsor'

export interface LogoFetchingService {
  fetchFromClearbit(website: string): Promise<string>
  fetchFromLogoDev(website: string): Promise<string>
  fetchFavicon(website: string): Promise<string>
  fetchLogo(website: string, companyName?: string): Promise<LogoFetchResponse>
  validateLogoUrl(url: string): Promise<boolean>
}

export class LogoService implements LogoFetchingService {
  private readonly CLEARBIT_BASE_URL = 'https://logo.clearbit.com'
  private readonly LOGO_DEV_BASE_URL = 'https://logo.dev/api/logo'
  
  /**
   * Extract domain from website URL
   */
  private extractDomain(website: string): string {
    try {
      const url = new URL(website)
      return url.hostname
    } catch {
      // If it's not a valid URL, assume it's already a domain
      return website.replace(/^https?:\/\//, '').replace(/^www\./, '')
    }
  }

  /**
   * Fetch logo from Clearbit service
   */
  async fetchFromClearbit(website: string): Promise<string> {
    const domain = this.extractDomain(website)
    const logoUrl = `${this.CLEARBIT_BASE_URL}/${domain}`
    
    // Test if the logo exists by making a HEAD request
    try {
      const response = await fetch(logoUrl, { method: 'HEAD' })
      if (response.ok) {
        return logoUrl
      }
      throw new Error('Logo not found')
    } catch (error) {
      throw new Error(`Clearbit logo not available for ${domain}`)
    }
  }

  /**
   * Fetch logo from Logo.dev service
   */
  async fetchFromLogoDev(website: string): Promise<string> {
    try {
      const response = await fetch(`${this.LOGO_DEV_BASE_URL}?url=${encodeURIComponent(website)}`)
      
      if (!response.ok) {
        throw new Error(`Logo.dev API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.logo_url) {
        return data.logo_url
      }
      
      throw new Error('No logo URL returned from Logo.dev')
    } catch (error) {
      throw new Error(`Logo.dev service error: ${error.message}`)
    }
  }

  /**
   * Fetch favicon from website
   */
  async fetchFavicon(website: string): Promise<string> {
    const domain = this.extractDomain(website)
    const faviconUrl = `https://${domain}/favicon.ico`
    
    try {
      const response = await fetch(faviconUrl, { method: 'HEAD' })
      if (response.ok) {
        return faviconUrl
      }
      throw new Error('Favicon not found')
    } catch (error) {
      throw new Error(`Favicon not available for ${domain}`)
    }
  }

  /**
   * Validate if a logo URL is accessible
   */
  async validateLogoUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Fetch logo from multiple sources with fallback
   */
  async fetchLogo(website: string, companyName?: string): Promise<LogoFetchResponse> {
    const sources: { source: LogoSource; fetcher: () => Promise<string> }[] = [
      { source: 'clearbit', fetcher: () => this.fetchFromClearbit(website) },
      { source: 'logo-dev', fetcher: () => this.fetchFromLogoDev(website) },
      { source: 'favicon', fetcher: () => this.fetchFavicon(website) }
    ]

    for (const { source, fetcher } of sources) {
      try {
        const logoUrl = await fetcher()
        
        // Validate the fetched logo URL
        const isValid = await this.validateLogoUrl(logoUrl)
        if (isValid) {
          return {
            logo_url: logoUrl,
            source,
            success: true
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch logo from ${source}:`, error.message)
        continue
      }
    }

    return {
      logo_url: '',
      source: 'manual',
      success: false,
      error: 'Failed to fetch logo from any source'
    }
  }

  /**
   * Generate Clearbit logo URL (for display purposes)
   */
  generateClearbitUrl(website: string): string {
    const domain = this.extractDomain(website)
    return `${this.CLEARBIT_BASE_URL}/${domain}`
  }

  /**
   * Get logo preview data
   */
  async getLogoPreview(logoUrl: string): Promise<{
    url: string
    isLoaded: boolean
    error?: string
  }> {
    try {
      const isValid = await this.validateLogoUrl(logoUrl)
      return {
        url: logoUrl,
        isLoaded: isValid,
        error: isValid ? undefined : 'Logo URL is not accessible'
      }
    } catch (error) {
      return {
        url: logoUrl,
        isLoaded: false,
        error: error.message
      }
    }
  }
}

// Singleton instance
export const logoService = new LogoService()

// Utility functions
export const extractDomainFromWebsite = (website: string): string => {
  return logoService['extractDomain'](website)
}

export const generateClearbitLogoUrl = (website: string): string => {
  return logoService.generateClearbitUrl(website)
}

// React hook for logo fetching
export const useLogoFetching = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogo = async (website: string, companyName?: string): Promise<LogoFetchResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await logoService.fetchLogo(website, companyName)
      if (!result.success) {
        setError(result.error || 'Failed to fetch logo')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        logo_url: '',
        source: 'manual',
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  const validateLogo = async (logoUrl: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      return await logoService.validateLogoUrl(logoUrl)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    fetchLogo,
    validateLogo,
    isLoading,
    error
  }
}

// Import React for the hook
import { useState } from 'react'
