# Database Structure Reference Document

**Generated:** 2025-09-08T04:57:48.620Z  
**Connection Method:** Supabase API (per ADR-001)  
**Database URL:** https://iikcgdhztkrexuuqheli.supabase.co

## Overview

This document provides a comprehensive reference for the Knowledge Now React application database structure. The analysis was performed using the Supabase API approach as recommended in ADR-001 to work with Row Level Security (RLS) constraints.

### Database Summary
- **Total Tables:** 11
- **Total Rows:** 278
- **Connection Method:** Supabase API (RLS-compliant)

## Table Analysis

### agenda_items

**Row Count:** 0  
**Columns:** 0

#### Column Structure
*No column information available (table may be empty)*

#### Analysis Notes
- Structure analysis error: Table is empty, cannot infer structure

---

### attendees

**Row Count:** 222  
**Columns:** 40

#### Column Structure
| Column Name | Data Type | Nullable | Default | Notes |
|-------------|-----------|----------|---------|-------|
| `id` | `string` | No | - | - |
| `salutation` | `string` | No | - | - |
| `first_name` | `string` | No | - | - |
| `last_name` | `string` | No | - | - |
| `email` | `string` | No | - | - |
| `title` | `string` | No | - | - |
| `company` | `string` | No | - | - |
| `bio` | `string` | No | - | - |
| `photo` | `string` | No | - | - |
| `business_phone` | `string` | No | - | - |
| `mobile_phone` | `string` | No | - | - |
| `check_in_date` | `string` | No | - | - |
| `check_out_date` | `string` | No | - | - |
| `hotel_selection` | `string` | No | - | - |
| `custom_hotel` | `string` | No | - | - |
| `registration_id` | `string` | No | - | - |
| `has_spouse` | `boolean` | No | - | - |
| `spouse_details` | `object` | No | - | - |
| `dining_selections` | `object` | No | - | - |
| `selected_breakouts` | `object` | No | - | - |
| `registration_status` | `string` | No | - | - |
| `access_code` | `string` | No | - | - |
| `attributes` | `object` | No | - | - |
| `dietary_requirements` | `string` | No | - | - |
| `address1` | `string` | No | - | - |
| `address2` | `string` | No | - | - |
| `postal_code` | `string` | No | - | - |
| `city` | `string` | No | - | - |
| `state` | `string` | No | - | - |
| `country` | `string` | No | - | - |
| `country_code` | `string` | No | - | - |
| `room_type` | `string` | No | - | - |
| `assistant_name` | `string` | No | - | - |
| `assistant_email` | `string` | No | - | - |
| `idloom_id` | `string` | No | - | - |
| `last_synced_at` | `string` | No | - | - |
| `created_at` | `string` | No | - | - |
| `updated_at` | `string` | No | - | - |
| `is_cfo` | `boolean` | No | - | - |
| `is_apax_ep` | `boolean` | No | - | - |

#### Sample Data
```json
[
  {
    "id": "1628d24f-4e7a-444d-82f2-426ad238823a",
    "salutation": "Dr",
    "first_name": "Ayla",
    "last_name": "Queiroga",
    "email": "aqueiroga@accordion.com",
    "title": "Managing Director",
    "company": "Accordion",
    "bio": "",
    "photo": "https://logo.clearbit.com/acrdion.com",
    "business_phone": "6039916049",
    "mobile_phone": "6039916049",
    "check_in_date": "2025-10-20",
    "check_out_date": "2025-10-22",
    "hotel_selection": "four-seasons",
    "custom_hotel": "",
    "registration_id": "2025-07-22T09:35:36-05:00",
    "has_spouse": false,
    "spouse_details": {
      "email": "",
      "lastName": "",
      "firstName": "",
      "salutation": "",
      "mobilePhone": "",
      "dietaryRequirements": ""
    },
    "dining_selections": {
      "welcome-reception-monday": {
        "attending": true
      },
      "networking-dinner-tuesday": {
        "attending": true
      }
    },
    "selected_breakouts": [
      "track-b-operational-performance"
    ],
    "registration_status": "confirmed",
    "access_code": "729209",
    "attributes": {
      "ceo": false,
      "apaxIP": false,
      "spouse": false,
      "apaxOEP": false,
      "speaker": false,
      "cLevelExec": true,
      "sponsorAttendee": true,
      "otherAttendeeType": false,
      "portfolioCompanyExecutive": false
    },
    "dietary_requirements": "Vegetarian",
    "address1": "One Vanderbilt",
    "address2": "Suite 2401",
    "postal_code": "10017",
    "city": "New York",
    "state": "new york",
    "country": "United States",
    "country_code": "US",
    "room_type": "City or Lake-view King",
    "assistant_name": "",
    "assistant_email": "",
    "idloom_id": "",
    "last_synced_at": "2025-09-05T16:44:17.603855+00:00",
    "created_at": "2025-09-05T16:44:17.603855+00:00",
    "updated_at": "2025-09-05T16:44:17.603855+00:00",
    "is_cfo": false,
    "is_apax_ep": false
  },
  {
    "id": "a94780e1-1f32-4c96-8359-c07467a3c406",
    "salutation": "Mr",
    "first_name": "Nigel",
    "last_name": "Lemmon",
    "email": "nlemmon@toscaltd.com",
    "title": "Global CIO",
    "company": "Tosca Ltd",
    "bio": "",
    "photo": "https://logo.clearbit.com/tosca.com",
    "business_phone": "+44 (0)7809453555",
    "mobile_phone": "+44 (0)7809453555",
    "check_in_date": "2025-03-15",
    "check_out_date": "2025-03-17",
    "hotel_selection": "own-arrangements",
    "custom_hotel": "",
    "registration_id": "2025-07-22T09:36:47-05:00",
    "has_spouse": false,
    "spouse_details": {
      "email": "",
      "lastName": "",
      "firstName": "",
      "salutation": "",
      "mobilePhone": "",
      "dietaryRequirements": ""
    },
    "dining_selections": {
      "welcome-reception-monday": {
        "attending": true
      },
      "networking-dinner-tuesday": {
        "attending": true
      }
    },
    "selected_breakouts": [
      "track-a-revenue-growth"
    ],
    "registration_status": "confirmed",
    "access_code": "301014",
    "attributes": {
      "ceo": false,
      "apaxIP": false,
      "spouse": false,
      "apaxOEP": false,
      "speaker": false,
      "cLevelExec": false,
      "sponsorAttendee": false,
      "otherAttendeeType": false,
      "portfolioCompanyExecutive": true
    },
    "dietary_requirements": "No shellfish",
    "address1": "Suite 1900",
    "address2": "1175 Peachtree St NE",
    "postal_code": "30361",
    "city": "Atlanta",
    "state": "GA",
    "country": "United States",
    "country_code": "US",
    "room_type": "",
    "assistant_name": "",
    "assistant_email": "",
    "idloom_id": "",
    "last_synced_at": "2025-09-05T16:44:17.603855+00:00",
    "created_at": "2025-09-05T16:44:17.603855+00:00",
    "updated_at": "2025-09-05T16:44:17.603855+00:00",
    "is_cfo": false,
    "is_apax_ep": false
  },
  {
    "id": "fb4d4f9d-7448-48d0-b382-e3cd5e070227",
    "salutation": "Mrs",
    "first_name": "Evelina",
    "last_name": "Stromberg",
    "email": "evelina.stromberg@vertice.one",
    "title": "Private Equity Partnerships",
    "company": "Vertice",
    "bio": "",
    "photo": "https://logo.clearbit.com/vertice.com",
    "business_phone": "+44 7593 361 329",
    "mobile_phone": "+44 7593 361 329",
    "check_in_date": "2025-10-20",
    "check_out_date": "2025-10-22",
    "hotel_selection": "four-seasons",
    "custom_hotel": "",
    "registration_id": "2025-07-22T09:37:52-05:00",
    "has_spouse": false,
    "spouse_details": {
      "email": "",
      "lastName": "",
      "firstName": "",
      "salutation": "",
      "mobilePhone": "",
      "dietaryRequirements": ""
    },
    "dining_selections": {
      "welcome-reception-monday": {
        "attending": true
      },
      "networking-dinner-tuesday": {
        "attending": true
      }
    },
    "selected_breakouts": [
      "track-b-operational-performance"
    ],
    "registration_status": "confirmed",
    "access_code": "450717",
    "attributes": {
      "ceo": false,
      "apaxIP": false,
      "spouse": false,
      "apaxOEP": false,
      "speaker": false,
      "cLevelExec": false,
      "sponsorAttendee": true,
      "otherAttendeeType": false,
      "portfolioCompanyExecutive": false
    },
    "dietary_requirements": "",
    "address1": "338 Euston Road",
    "address2": "",
    "postal_code": "NW1 3BT",
    "city": "London",
    "state": "London",
    "country": "United Kingdom",
    "country_code": "GB",
    "room_type": "City or Lake-view King",
    "assistant_name": "",
    "assistant_email": "",
    "idloom_id": "",
    "last_synced_at": "2025-09-05T16:44:17.603855+00:00",
    "created_at": "2025-09-05T16:44:17.603855+00:00",
    "updated_at": "2025-09-05T16:44:17.603855+00:00",
    "is_cfo": false,
    "is_apax_ep": false
  }
]
```

---

### breakout_sessions

**Row Count:** 0  
**Columns:** 0

#### Column Structure
*No column information available (table may be empty)*

#### Analysis Notes
- Structure analysis error: Table is empty, cannot infer structure

---

### dining_options

**Row Count:** 0  
**Columns:** 0

#### Column Structure
*No column information available (table may be empty)*

#### Analysis Notes
- Structure analysis error: Table is empty, cannot infer structure

---

### hotels

**Row Count:** 0  
**Columns:** 0

#### Column Structure
*No column information available (table may be empty)*

#### Analysis Notes
- Structure analysis error: Table is empty, cannot infer structure

---

### import_history

**Row Count:** 0  
**Columns:** 0

#### Column Structure
*No column information available (table may be empty)*

#### Analysis Notes
- Structure analysis error: Table is empty, cannot infer structure

---

### layout_templates

**Row Count:** 0  
**Columns:** 0

#### Column Structure
*No column information available (table may be empty)*

#### Analysis Notes
- Structure analysis error: Table is empty, cannot infer structure

---

### seat_assignments

**Row Count:** 29  
**Columns:** 15

#### Column Structure
| Column Name | Data Type | Nullable | Default | Notes |
|-------------|-----------|----------|---------|-------|
| `id` | `string` | No | - | - |
| `seating_configuration_id` | `string` | No | - | - |
| `attendee_id` | `string` | No | - | - |
| `table_name` | `object` | Yes | - | - |
| `seat_number` | `object` | Yes | - | - |
| `seat_position` | `object` | No | - | - |
| `assignment_type` | `string` | No | - | - |
| `assigned_at` | `string` | No | - | - |
| `notes` | `string` | No | - | - |
| `created_at` | `string` | No | - | - |
| `updated_at` | `string` | No | - | - |
| `column_number` | `number` | No | - | - |
| `row_number` | `number` | No | - | - |
| `attendee_first_name` | `string` | No | - | - |
| `attendee_last_name` | `string` | No | - | - |

#### Sample Data
```json
[
  {
    "id": "fa11e4a7-6a51-417c-b760-12635a731426",
    "seating_configuration_id": "b890ef94-3cdd-4c30-982d-884a1cec4bd5",
    "attendee_id": "c0a9aac3-ed44-4ebf-b1e7-08b4eb899fd8",
    "table_name": null,
    "seat_number": null,
    "seat_position": {
      "x": 0,
      "y": 0
    },
    "assignment_type": "manual",
    "assigned_at": "2025-09-07T02:19:05.826+00:00",
    "notes": "",
    "created_at": "2025-09-07T02:19:06.108597+00:00",
    "updated_at": "2025-09-07T02:19:06.108597+00:00",
    "column_number": 5,
    "row_number": 4,
    "attendee_first_name": "Jason",
    "attendee_last_name": "Wright"
  },
  {
    "id": "043221c2-4152-491e-9413-7db543a4d7b5",
    "seating_configuration_id": "b890ef94-3cdd-4c30-982d-884a1cec4bd5",
    "attendee_id": "999e6630-70b3-493b-818b-85610d5d1183",
    "table_name": null,
    "seat_number": null,
    "seat_position": {
      "x": 0,
      "y": 0
    },
    "assignment_type": "manual",
    "assigned_at": "2025-09-07T02:19:05.826+00:00",
    "notes": "",
    "created_at": "2025-09-07T02:19:06.108597+00:00",
    "updated_at": "2025-09-07T02:19:06.108597+00:00",
    "column_number": 0,
    "row_number": 4,
    "attendee_first_name": "Carlos",
    "attendee_last_name": "Ramon"
  },
  {
    "id": "43216698-b9ee-4437-920b-5a05103dc211",
    "seating_configuration_id": "b890ef94-3cdd-4c30-982d-884a1cec4bd5",
    "attendee_id": "8b81de30-99d8-4a5e-876b-8dc640a28a59",
    "table_name": null,
    "seat_number": null,
    "seat_position": {
      "x": 0,
      "y": 0
    },
    "assignment_type": "manual",
    "assigned_at": "2025-09-07T02:19:05.826+00:00",
    "notes": "",
    "created_at": "2025-09-07T02:19:06.108597+00:00",
    "updated_at": "2025-09-07T02:19:06.108597+00:00",
    "column_number": 3,
    "row_number": 2,
    "attendee_first_name": "ROGER",
    "attendee_last_name": "MCCRACKEN"
  }
]
```

---

### seating_configurations

**Row Count:** 0  
**Columns:** 0

#### Column Structure
*No column information available (table may be empty)*

#### Analysis Notes
- Structure analysis error: Table is empty, cannot infer structure

---

### sponsors

**Row Count:** 27  
**Columns:** 8

#### Column Structure
| Column Name | Data Type | Nullable | Default | Notes |
|-------------|-----------|----------|---------|-------|
| `id` | `string` | No | - | - |
| `name` | `string` | No | - | - |
| `logo` | `string` | No | - | - |
| `website` | `string` | No | - | - |
| `is_active` | `boolean` | No | - | - |
| `display_order` | `number` | No | - | - |
| `created_at` | `string` | No | - | - |
| `updated_at` | `string` | No | - | - |

#### Sample Data
```json
[
  {
    "id": "b558da1f-51b3-48be-9ee4-75aae1a5d1ab",
    "name": "Accordion",
    "logo": "https://logo.clearbit.com/accordion.com",
    "website": "https://accordion.com",
    "is_active": true,
    "display_order": 1,
    "created_at": "2025-09-05T11:58:52.803725+00:00",
    "updated_at": "2025-09-05T11:58:52.803725+00:00"
  },
  {
    "id": "2acdbcd7-3ccd-4fa9-a2c3-b805e0f8a8d5",
    "name": "Alvarez & Marsal",
    "logo": "https://logo.clearbit.com/alvarezandmarsal.com",
    "website": "https://alvarezandmarsal.com",
    "is_active": true,
    "display_order": 2,
    "created_at": "2025-09-05T11:58:52.803725+00:00",
    "updated_at": "2025-09-05T11:58:52.803725+00:00"
  },
  {
    "id": "4dff9022-1a9d-461c-b167-4f5a07c74cdd",
    "name": "Amazon Web Services",
    "logo": "https://logo.clearbit.com/aws.amazon.com",
    "website": "https://aws.amazon.com",
    "is_active": true,
    "display_order": 3,
    "created_at": "2025-09-05T11:58:52.803725+00:00",
    "updated_at": "2025-09-05T11:58:52.803725+00:00"
  }
]
```

---

### user_profiles

**Row Count:** 0  
**Columns:** 0

#### Column Structure
*No column information available (table may be empty)*

#### Analysis Notes
- Structure analysis error: Table is empty, cannot infer structure

---

## Architecture Recommendations

Based on the database structure analysis, here are key architectural considerations:

### Data Access Patterns
- **RLS Compliance:** All data access must go through Supabase API to respect Row Level Security
- **Read-Only Operations:** Current setup supports read-only access for analysis and reporting
- **Authentication Required:** All API calls require proper Supabase authentication

### Performance Considerations
- **Empty Tables:** All tables are currently empty, indicating this is a fresh database setup
- **API Rate Limits:** Monitor Supabase API usage to avoid rate limiting
- **Caching Strategy:** Implement caching for frequently accessed data

### Security Implications
- **RLS Policies:** All tables have Row Level Security enabled
- **API-Only Access:** Direct database connections are blocked by RLS
- **Authentication Flow:** Ensure proper user authentication before data access

### Development Recommendations
1. **Data Seeding:** Consider populating tables with sample data for development
2. **Schema Validation:** Implement client-side schema validation
3. **Error Handling:** Robust error handling for API failures
4. **Type Safety:** Generate TypeScript types from database schema

## Next Steps

1. **Populate Sample Data:** Add realistic test data to all tables
2. **Define RLS Policies:** Create appropriate Row Level Security policies
3. **Implement Data Access Layer:** Build abstraction layer for database operations
4. **Generate TypeScript Types:** Create type definitions from schema
5. **Performance Testing:** Test API performance with realistic data volumes

---

*This document was automatically generated by the database structure analysis script.*
