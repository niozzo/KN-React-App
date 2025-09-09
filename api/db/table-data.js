import { getDirectTableData } from '../../lib/direct-db.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  const { table, limit = 10, offset = 0 } = req.query;

  // Validate required parameters
  if (!table) {
    return res.status(400).json({
      success: false,
      data: null,
      rowCount: 0,
      error: 'Table name is required. Use ?table=table_name',
      timestamp: new Date().toISOString()
    });
  }

  // Validate limit
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      data: null,
      rowCount: 0,
      error: 'Limit must be a number between 1 and 100',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`🔍 API: Getting data from table '${table}' (limit: ${limitNum})`);
    
    const result = await getDirectTableData(table, limitNum);
    
    if (result.success) {
      console.log(`✅ API: Retrieved ${result.rowCount} rows from '${table}'`);
      return res.status(200).json({
        success: true,
        data: result.data,
        rowCount: result.rowCount,
        table: table,
        limit: limitNum,
        error: null,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ API: Failed to get data from '${table}':`, result.error);
      return res.status(500).json({
        success: false,
        data: null,
        rowCount: 0,
        table: table,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      rowCount: 0,
      table: table,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
