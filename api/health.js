export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        api: 'operational',
        database: 'unknown' // Will be tested by other endpoints
      }
    };

    console.log('✅ API: Health check successful');
    return res.status(200).json(health);
  } catch (error) {
    console.error('❌ API: Health check failed:', error.message);
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}
