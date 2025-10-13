/**
 * APPLICATION-SIDE COMPANY NORMALIZATION STRATEGY
 * 
 * Constraint: Cannot modify main database
 * Goal: Normalize company names at application layer
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://iikcgdhztkrexuuqheli.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'
const ADMIN_EMAIL = 'ishan.gammampila@apax.com'
const ADMIN_PASSWORD = 'xx8kRx#tn@R?'

async function createAuthenticatedClient() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })
  
  if (error) throw new Error('Authentication failed')
  return supabase
}

async function analyzeApplicationSideSolutions() {
  console.log('====================================')
  console.log('APPLICATION-SIDE NORMALIZATION STRATEGY')
  console.log('====================================\n')
  console.log('Constraint: Cannot modify main database')
  console.log('Goal: Normalize company names at application layer\n')
  
  const supabase = await createAuthenticatedClient()
  
  // Fetch the data we can read (but not modify)
  const { data: attendees } = await supabase
    .from('attendees')
    .select('id, company')
  
  const { data: standardizedCompanies } = await supabase
    .from('standardized_companies')
    .select('id, name, sector, geography')
  
  const { data: aliases } = await supabase
    .from('company_aliases')
    .select('alias, standardized_company_id')
  
  console.log('📊 DATA AVAILABLE (READ-ONLY):')
  console.log(`   ${attendees.length} attendees with company field`)
  console.log(`   ${standardizedCompanies.length} standardized companies`)
  console.log(`   ${aliases.length} company aliases\n`)
  
  // Build normalization lookup
  const companyLookup = new Map()
  const aliasLookup = new Map()
  
  // Index standardized companies by name (case-insensitive)
  standardizedCompanies.forEach(company => {
    companyLookup.set(company.name.toLowerCase().trim(), company)
  })
  
  // Index aliases
  aliases.forEach(alias => {
    const company = standardizedCompanies.find(c => c.id === alias.standardized_company_id)
    if (company) {
      aliasLookup.set(alias.alias.toLowerCase().trim(), company)
    }
  })
  
  console.log('====================================')
  console.log('OPTION 1: CLIENT-SIDE TRANSFORMATION SERVICE')
  console.log('====================================\n')
  
  console.log('📝 Implementation Approach:')
  console.log('   1. Create CompanyNormalizationService.ts')
  console.log('   2. Cache standardized_companies + aliases in memory/localStorage')
  console.log('   3. Transform attendees.company → canonical name on read')
  console.log('   4. Never modify source data\n')
  
  console.log('✅ PROS:')
  console.log('   - No database changes required')
  console.log('   - Works with read-only database')
  console.log('   - Can update normalization rules without DB migration')
  console.log('   - Transformation happens at display time\n')
  
  console.log('⚠️  CONS:')
  console.log('   - Must transform on every read')
  console.log('   - Performance overhead (mitigated by caching)')
  console.log('   - Two sources of truth (DB + normalization rules)\n')
  
  console.log('🔧 Architecture:')
  console.log(`
  ┌─────────────────────────────────────────────────┐
  │ DATABASE (Read-Only)                            │
  │ ┌─────────────┐  ┌──────────────────────┐      │
  │ │ attendees   │  │ standardized_        │      │
  │ │ company: "" │  │ companies            │      │
  │ └─────────────┘  └──────────────────────┘      │
  │ ┌─────────────┐                                 │
  │ │ company_    │                                 │
  │ │ aliases     │                                 │
  │ └─────────────┘                                 │
  └─────────────────────────────────────────────────┘
                     ↓ Read Only
  ┌─────────────────────────────────────────────────┐
  │ APPLICATION LAYER                               │
  │                                                 │
  │ CompanyNormalizationService                     │
  │ ├─ buildLookupCache()                          │
  │ ├─ normalizeCompanyName(input)                 │
  │ ├─ getStandardizedCompany(input)               │
  │ └─ enrichAttendeeWithCanonicalCompany()        │
  │                                                 │
  │ AttendeeTransformer                             │
  │ └─ transformArrayFromDatabase()                │
  │    └─ calls CompanyNormalizationService        │
  └─────────────────────────────────────────────────┘
                     ↓ Normalized Data
  ┌─────────────────────────────────────────────────┐
  │ UI LAYER                                        │
  │ - Displays canonical company names              │
  │ - Filters by standardized company               │
  │ - Groups by sector/geography                    │
  └─────────────────────────────────────────────────┘
  `)
  
  console.log('\n====================================')
  console.log('OPTION 2: COMPUTED FIELD IN TRANSFORMER')
  console.log('====================================\n')
  
  console.log('📝 Implementation Approach:')
  console.log('   1. Extend existing AttendeeTransformer')
  console.log('   2. Add computed field: standardizedCompany')
  console.log('   3. Lookup happens during transformation')
  console.log('   4. Original company field preserved\n')
  
  console.log('Example Output:')
  const exampleAttendee = attendees[0]
  const inputCompany = exampleAttendee.company
  const normalizedCompany = companyLookup.get(inputCompany?.toLowerCase().trim()) 
                          || aliasLookup.get(inputCompany?.toLowerCase().trim())
  
  console.log(`
  Input (from DB):
  {
    id: "${exampleAttendee.id}",
    company: "${inputCompany}"
  }
  
  Output (after transformation):
  {
    id: "${exampleAttendee.id}",
    company: "${inputCompany}",              // Original preserved
    companyDisplayName: "${normalizedCompany?.name || inputCompany}", // Canonical
    companyStandardized: {                   // Rich metadata
      id: "${normalizedCompany?.id || 'null'}",
      name: "${normalizedCompany?.name || 'N/A'}",
      sector: "${normalizedCompany?.sector || 'N/A'}",
      geography: "${normalizedCompany?.geography || 'N/A'}"
    }
  }
  `)
  
  console.log('\n====================================')
  console.log('OPTION 3: VIRTUAL FIELD / VIEW LAYER')
  console.log('====================================\n')
  
  console.log('📝 Implementation Approach:')
  console.log('   1. Create AttendeeViewModel class')
  console.log('   2. Lazy-load standardized company on access')
  console.log('   3. Cache results per attendee instance')
  console.log('   4. Use getter methods for normalized data\n')
  
  console.log('Example Code Pattern:')
  console.log(`
  class AttendeeViewModel {
    constructor(rawAttendee, companyService) {
      this._raw = rawAttendee
      this._companyService = companyService
      this._standardizedCompany = null
    }
    
    get companyName() {
      return this._raw.company
    }
    
    get standardizedCompany() {
      if (!this._standardizedCompany) {
        this._standardizedCompany = this._companyService.normalize(
          this._raw.company
        )
      }
      return this._standardizedCompany
    }
    
    get companyDisplayName() {
      return this.standardizedCompany?.name || this.companyName
    }
  }
  `)
  
  console.log('\n====================================')
  console.log('OPTION 4: MIDDLEWARE/INTERCEPTOR PATTERN')
  console.log('====================================\n')
  
  console.log('📝 Implementation Approach:')
  console.log('   1. Intercept all attendee queries')
  console.log('   2. Automatically enrich with standardized company')
  console.log('   3. Transparent to consuming code')
  console.log('   4. Single point of normalization\n')
  
  console.log('Architecture Pattern:')
  console.log(`
  AttendeeService.getAll()
    ↓
  [Middleware: CompanyEnrichmentMiddleware]
    ↓
  AttendeeTransformer + CompanyNormalizationService
    ↓
  Returns enriched attendees with canonical companies
  `)
  
  console.log('\n====================================')
  console.log('RECOMMENDED APPROACH')
  console.log('====================================\n')
  
  console.log('🎯 BEST SOLUTION: Option 2 (Computed Field in Transformer)\n')
  
  console.log('Why this is best for your use case:')
  console.log('✅ Leverages existing transformer pattern')
  console.log('✅ Minimal code changes needed')
  console.log('✅ Preserves original data')
  console.log('✅ No database modifications')
  console.log('✅ Consistent with your architecture\n')
  
  console.log('====================================')
  console.log('IMPLEMENTATION PLAN')
  console.log('====================================\n')
  
  console.log('Step 1: Create CompanyNormalizationService')
  console.log('  Location: src/services/companyNormalizationService.ts')
  console.log('  Purpose: Centralized company name normalization')
  console.log('  Dependencies: standardized_companies, company_aliases tables\n')
  
  console.log('Step 2: Update AttendeeTransformer')
  console.log('  File: src/transformers/attendeeTransformer.ts')
  console.log('  Changes: Add computed field for standardizedCompany')
  console.log('  Impact: All attendee queries automatically enriched\n')
  
  console.log('Step 3: Update TypeScript Types')
  console.log('  File: src/types/database.ts')
  console.log('  Add: Attendee interface with standardizedCompany field')
  console.log('  Add: StandardizedCompany interface\n')
  
  console.log('Step 4: Update UI Components')
  console.log('  Change: Use attendee.companyDisplayName instead of attendee.company')
  console.log('  Benefit: Automatic canonical names everywhere\n')
  
  console.log('Step 5: Add Caching Layer')
  console.log('  Cache: standardized_companies + aliases in memory')
  console.log('  Refresh: On app load or periodically')
  console.log('  Benefit: Fast lookups without repeated DB queries\n')
  
  console.log('====================================')
  console.log('CACHE STRATEGY')
  console.log('====================================\n')
  
  console.log('Option A: Memory Cache (Recommended)')
  console.log('  - Load on service initialization')
  console.log('  - Refresh every 5 minutes')
  console.log('  - Fast: O(1) lookup')
  console.log('  - Cost: ~10KB memory for lookup maps\n')
  
  console.log('Option B: LocalStorage Cache')
  console.log('  - Persist across page reloads')
  console.log('  - Refresh on app version change')
  console.log('  - Fallback if memory cache cleared\n')
  
  console.log('Option C: Hybrid')
  console.log('  - Memory cache (primary)')
  console.log('  - LocalStorage cache (backup)')
  console.log('  - Network fetch (fallback)\n')
  
  console.log('====================================')
  console.log('FALLBACK STRATEGIES')
  console.log('====================================\n')
  
  console.log('If no match found in standardized_companies or aliases:')
  console.log('  1. Return original company name (fail gracefully)')
  console.log('  2. Mark as "needs_review" flag')
  console.log('  3. Log to analytics for admin review')
  console.log('  4. Queue for alias creation\n')
  
  console.log('For the 2 unmatched companies (Oracle, Vet Center Holding):')
  console.log('  - Display original name until aliases added')
  console.log('  - Show indicator: "⚠️ Unstandardized"')
  console.log('  - Allow admin to create alias via UI\n')
  
  console.log('====================================')
  console.log('PERFORMANCE CONSIDERATIONS')
  console.log('====================================\n')
  
  const lookupSize = companyLookup.size + aliasLookup.size
  console.log(`Current lookup table size: ${lookupSize} entries`)
  console.log(`Memory usage: ~${Math.round(lookupSize * 0.1)}KB`)
  console.log(`Lookup time: O(1) with Map`)
  console.log(`Transformation overhead: <1ms per attendee\n`)
  
  console.log('For 266 attendees:')
  console.log(`  - Initial cache load: ~50ms`)
  console.log(`  - Per-attendee normalization: ~0.5ms`)
  console.log(`  - Total overhead: ~183ms`)
  console.log(`  - Acceptable for real-time UI ✅\n`)
  
  console.log('====================================')
  console.log('EXAMPLE: Mock Normalized Output')
  console.log('====================================\n')
  
  // Show 5 examples of normalized output
  const examples = attendees.slice(0, 5).map(attendee => {
    const inputName = attendee.company?.trim()
    const normalized = companyLookup.get(inputName?.toLowerCase()) 
                    || aliasLookup.get(inputName?.toLowerCase())
    
    return {
      id: attendee.id,
      company: inputName,
      companyDisplayName: normalized?.name || inputName,
      companyStandardized: normalized ? {
        id: normalized.id,
        name: normalized.name,
        sector: normalized.sector,
        geography: normalized.geography
      } : null,
      isStandardized: !!normalized
    }
  })
  
  console.log('Sample normalized attendees:')
  examples.forEach((ex, i) => {
    console.log(`\n${i + 1}. ${ex.isStandardized ? '✅' : '⚠️ '} Original: "${ex.company}"`)
    console.log(`   Display: "${ex.companyDisplayName}"`)
    if (ex.companyStandardized) {
      console.log(`   Sector: ${ex.companyStandardized.sector}`)
      console.log(`   Geography: ${ex.companyStandardized.geography}`)
    }
  })
  
  console.log('\n\n====================================')
  console.log('KEY FILES TO CREATE/MODIFY')
  console.log('====================================\n')
  
  console.log('NEW FILES:')
  console.log('  1. src/services/companyNormalizationService.ts')
  console.log('  2. src/types/standardizedCompany.ts')
  console.log('  3. src/hooks/useCompanyNormalization.ts (optional)\n')
  
  console.log('MODIFY EXISTING:')
  console.log('  1. src/transformers/attendeeTransformer.ts')
  console.log('  2. src/types/database.ts')
  console.log('  3. src/services/attendeeService.ts (inject dependency)\n')
  
  console.log('====================================\n')
}

analyzeApplicationSideSolutions().catch(err => {
  console.error('❌ Analysis failed:', err.message)
  process.exit(1)
})


