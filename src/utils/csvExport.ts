/**
 * CSV Export Utility
 * Generates CSV content for attendee data with user-specific URLs
 */

export interface AttendeeExportData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  access_code: string;
  registration_status?: string;
}

/**
 * Generates CSV content for attendee data
 * @param attendees Array of attendee data
 * @param baseUrl Base URL for generating user-specific login URLs
 * @returns CSV content as string
 */
export function generateAttendeeCSV(
  attendees: AttendeeExportData[],
  baseUrl: string = window.location.origin
): string {
  // CSV header
  const headers = ['First Name', 'Last Name', 'Email', 'Access Code', 'User Specific URL'];
  
  // Generate CSV rows
  const rows = attendees.map(attendee => {
    const fullName = `${attendee.first_name} ${attendee.last_name}`;
    const userUrl = `${baseUrl}/login?code=${attendee.access_code}`;
    
    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    return [
      escapeCSV(attendee.first_name),
      escapeCSV(attendee.last_name),
      escapeCSV(attendee.email),
      escapeCSV(attendee.access_code),
      escapeCSV(userUrl)
    ].join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Downloads CSV content as a file
 * @param csvContent CSV content as string
 * @param filename Name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string = 'attendee-urls.csv'): void {
  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}
