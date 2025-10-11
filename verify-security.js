/**
 * Manual Security Verification Script
 * Run in browser console to check for confidential data in localStorage
 */

const confidentialFields = [
  'business_phone', 'mobile_phone', 'email',
  'check_in_date', 'check_out_date', 'hotel_selection', 'custom_hotel', 'room_type',
  'has_spouse', 'dietary_requirements', 'is_spouse', 'spouse_details',
  'address1', 'address2', 'postal_code', 'city', 'state', 'country', 'country_code',
  'assistant_name', 'assistant_email', 'idloom_id', 'access_code'
];

const attendeeCacheKeys = [
  'kn_cache_attendees',
  'kn_cache_attendee',
  'kn_current_attendee_info'
];

console.log('🔒 Security Audit: Checking localStorage for confidential data...\n');

const violations = [];

attendeeCacheKeys.forEach(key => {
  const data = localStorage.getItem(key);
  if (!data) {
    console.log(`✓ ${key}: Not found (OK)`);
    return;
  }

  try {
    const parsed = JSON.parse(data);
    const records = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
    
    records.forEach((record, index) => {
      if (record && typeof record === 'object') {
        confidentialFields.forEach(field => {
          if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
            violations.push({
              key,
              recordIndex: index,
              field,
              value: String(record[field]).substring(0, 30) + '...'
            });
          }
        });
      }
    });

    if (violations.filter(v => v.key === key).length === 0) {
      console.log(`✓ ${key}: ${records.length} record(s), no violations`);
    }
  } catch (e) {
    console.log(`⚠️  ${key}: Parse error`, e.message);
  }
});

console.log('\n' + '='.repeat(60));

if (violations.length === 0) {
  console.log('✅ PASS: No confidential data found in localStorage');
} else {
  console.log(`❌ FAIL: Found ${violations.length} security violations:`);
  violations.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.key}[${v.recordIndex}].${v.field}: ${v.value}`);
  });
}

console.log('='.repeat(60) + '\n');

