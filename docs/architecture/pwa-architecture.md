# PWA Architecture Documentation

## Overview

This document describes the Progressive Web App (PWA) architecture implemented in Story 1.3, including the service worker, data synchronization, offline capabilities, and cross-platform installation experience.

## PWA Components

### **Service Worker (`public/sw.js`)**

The service worker implements advanced caching strategies and background synchronization:

#### **Cache Strategy**
- **Static Assets**: Cache-first strategy for CSS, JS, images
- **API Requests**: Network-first strategy with offline fallback
- **Images**: Cache-first strategy with background updates
- **Navigation**: Network-first with offline page fallback

#### **Cache Management**
- **Version Control**: `CACHE_VERSION` for cache invalidation
- **Multi-Cache System**: Separate caches for static assets, data, and images
- **Cleanup**: Automatic cleanup of old caches on activation

#### **Background Sync**
- **Data Sync**: `data-sync` tag for background data synchronization
- **Push Notifications**: Support for push notification handling
- **Message Handling**: Communication with main thread for data caching

### **Data Synchronization Service (`src/services/pwaDataSyncService.ts`)**

#### **Authentication-Triggered Sync**
- **Trigger**: Automatically starts after successful user authentication
- **Security**: Never stores access codes or authentication tokens
- **Data Storage**: Uses IndexedDB for secure local data storage

#### **Sync Process**
1. **Schema Validation**: Validates database schema before sync
2. **Data Fetching**: Fetches all required tables from backend API
3. **Local Storage**: Stores data in IndexedDB for offline access
4. **Service Worker Integration**: Caches data in service worker
5. **Background Sync**: Registers background sync for periodic updates

#### **Supported Tables**
- `attendees` - Attendee information
- `sponsors` - Sponsor data
- `agenda_items` - Conference agenda
- `seat_assignments` - Seat assignments
- `dining_options` - Dining information
- `hotels` - Hotel information
- `seating_configurations` - Seating layouts
- `user_profiles` - User preferences

### **Schema Validation Service (`src/services/schemaValidationService.ts`)**

#### **Purpose**
- **Change Detection**: Automatically detects database schema changes
- **Validation**: Ensures data sync compatibility with current schema
- **Error Prevention**: Prevents sync failures due to schema mismatches

#### **Validation Process**
1. **Schema Inference**: Fetches sample data to infer current schema
2. **Structure Validation**: Compares against expected schema
3. **Type Checking**: Validates column data types
4. **Relationship Validation**: Ensures foreign key relationships are intact

### **Install Experience (`src/components/InstallPrompt.tsx`)**

#### **Cross-Platform Support**
- **Chrome/Edge**: Uses `beforeinstallprompt` API for native install
- **iOS Safari**: Shows modal with step-by-step instructions
- **Other Browsers**: Fallback to generic installation instructions

#### **Security Model**
- **No Login Page Install**: Install prompt removed from login for security
- **Authentication Required**: Data sync only after successful authentication
- **Access Code Protection**: Never stores access codes locally

## PWA Manifest (`public/manifest.webmanifest`)

### **App Configuration**
- **Name**: "Apax KnowledgeNow 2025 App"
- **Short Name**: "KnowledgeNow 2025"
- **Description**: "Apax KnowledgeNow 2025 - Conference PWA Application"
- **Theme Colors**: Apax brand colors (#9468CE, #0E1821)

### **Icons**
- **192x192**: Standard Android icon
- **512x512**: High-resolution Android icon
- **180x180**: iOS home screen icon
- **152x152**: iOS touch icon
- **144x144**: Windows tile icon
- **96x96**: Windows small tile
- **72x72**: Windows medium tile
- **SVG**: Scalable vector icon

### **Screenshots**
- **Mobile**: 390x844 (iPhone format)
- **Tablet**: 768x1020 (iPad format)
- **Desktop**: 1005x670 (wide format)

## Offline Capabilities

### **Offline Page (`public/offline.html`)**
- **Design**: Matches Apax brand guidelines
- **Functionality**: Retry button and background sync request
- **User Experience**: Clear messaging about offline status

### **Data Access**
- **Local Storage**: All data available offline via IndexedDB
- **Cache Strategy**: Intelligent caching for optimal offline experience
- **Sync Status**: Clear indication of data freshness

## Security Architecture

### **Data Protection**
- **Access Codes**: Never stored locally
- **Authentication**: Always required online
- **Data Sync**: Only after successful authentication
- **Local Storage**: Secure IndexedDB implementation

### **Privacy Considerations**
- **Attendee Data**: Stored locally for offline access
- **Sensitive Information**: Never cached or stored
- **User Control**: Clear data management options

## Performance Optimization

### **Caching Strategy**
- **Static Assets**: Aggressive caching for fast loading
- **API Data**: Smart caching with freshness validation
- **Images**: Optimized caching with size management

### **Background Sync**
- **Efficient Updates**: Only sync changed data
- **Battery Optimization**: Smart sync scheduling
- **Network Awareness**: Adapts to network conditions

## Testing Strategy

### **PWA Testing**
- **Lighthouse**: 100/100 PWA score target
- **Cross-Platform**: Chrome, Safari, Edge testing
- **Offline Testing**: Complete offline functionality validation

### **Data Sync Testing**
- **Schema Validation**: Automated schema change detection
- **Sync Performance**: Data sync speed and reliability
- **Error Handling**: Network failure and retry logic

## Deployment Considerations

### **Production Requirements**
- **HTTPS**: Required for PWA functionality
- **Service Worker**: Proper MIME type configuration
- **Manifest**: Valid JSON and proper headers

### **Monitoring**
- **PWA Metrics**: Install rates and usage patterns
- **Sync Performance**: Data synchronization success rates
- **Error Tracking**: Service worker and sync errors

## Future Enhancements

### **Advanced Features**
- **Push Notifications**: Real-time updates
- **Background Sync**: Enhanced offline capabilities
- **App Shortcuts**: Quick access to key features

### **Performance Improvements**
- **Lazy Loading**: On-demand data loading
- **Compression**: Data compression for faster sync
- **Caching**: More intelligent cache management

## Troubleshooting

### **Common Issues**
- **Install Prompt**: May take time to appear in Chrome
- **Service Worker**: Requires HTTPS in production
- **Data Sync**: May fail if schema changes unexpectedly

### **Debug Tools**
- **Chrome DevTools**: Service worker debugging
- **Lighthouse**: PWA audit and scoring
- **Network Tab**: Data sync monitoring

---

This PWA architecture provides a robust foundation for offline-first conference management with secure data synchronization and cross-platform installation capabilities.
