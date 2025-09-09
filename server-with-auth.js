import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Route to serve the authentication page with embedded credentials
app.get('/test-supabase-auth', (req, res) => {
  // Get credentials from environment variables
  const email = process.env.SUPABASE_USER_EMAIL || '';
  const password = process.env.SUPABASE_USER_PASSWORD || '';
  
  // Read the HTML template
  let html = readFileSync(path.join(__dirname, 'test-supabase-auth.html'), 'utf8');
  
  // Inject credentials into the HTML
  html = html.replace(
    'value=""',
    `value="${email}"`
  );
  
  // Inject auto-login script
  const autoLoginScript = `
    <script>
      // Auto-login configuration
      window.AUTO_LOGIN_CONFIG = {
        email: "${email}",
        password: "${password}",
        autoLogin: ${email && password ? 'true' : 'false'}
      };
    </script>
  `;
  
  // Insert the script before the closing head tag
  html = html.replace('</head>', `${autoLoginScript}</head>`);
  
  res.send(html);
});

// Default route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Supabase Database Explorer</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .links { margin-top: 30px; }
        .link { display: block; padding: 15px; margin: 10px 0; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; text-align: center; }
        .link:hover { background: #4338ca; }
        .info { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏗️ Supabase Database Explorer</h1>
        <div class="info">
          <strong>Server Status:</strong> Running on port ${PORT}<br>
          <strong>Auto-Login:</strong> ${process.env.SUPABASE_USER_EMAIL ? '✅ Configured' : '❌ Not configured'}
        </div>
        <div class="links">
          <a href="/test-supabase-auth" class="link">🔐 Database Explorer with Auto-Login</a>
          <a href="/test-supabase-website.html" class="link">🌐 Original Database Explorer</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auto-login configured: ${process.env.SUPABASE_USER_EMAIL ? 'Yes' : 'No'}`);
  if (process.env.SUPABASE_USER_EMAIL) {
    console.log(`👤 Auto-login email: ${process.env.SUPABASE_USER_EMAIL}`);
  }
});
