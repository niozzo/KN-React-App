import { getDirectTableStructure } from '../../lib/direct-db.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  const { table } = req.query;

  // Validate required parameters
  if (!table) {
    return res.status(400).json({
      success: false,
      columns: null,
      error: 'Table name is required. Use ?table=table_name',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`🔍 API: Getting structure for table '${table}'`);
    
    const result = await getDirectTableStructure(table);
    
    if (result.success) {
      console.log(`✅ API: Retrieved ${result.columns.length} columns from '${table}'`);
      return res.status(200).json({
        success: true,
        columns: result.columns,
        table: table,
        columnCount: result.columns.length,
        error: null,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ API: Failed to get structure for '${table}':`, result.error);
      return res.status(500).json({
        success: false,
        columns: null,
        table: table,
        columnCount: 0,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      columns: null,
      table: table,
      columnCount: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
