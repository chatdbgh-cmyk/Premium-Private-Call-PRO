import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API health endpoint (Returns 200 HTTP status with {"status": "ok"} for UptimeRobot, Render keep-alive & monitoring)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'PTS KING Backend',
  });
});

// Shorthand /health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// HEAD request support for ultra-fast ping checks
app.head('/api/health', (req, res) => {
  res.status(200).end();
});

// Resolve dist directory path
const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
  ? path.join(process.cwd(), 'dist')
  : path.join(__dirname);

// Serve static assets from Vite build
app.use(express.static(distPath));

// Google verification route fallback
app.get('/google4gmsDcVY_a-tfv6_5HvlUdAwPiTKW8Gke7oayOnm1mY.html', (req, res) => {
  res.type('text/html').send('google-site-verification: google4gmsDcVY_a-tfv6_5HvlUdAwPiTKW8Gke7oayOnm1mY.html');
});

// SPA catch-all fallback to index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application build in progress or dist/index.html not found.');
  }
});

// Start Express server on 0.0.0.0 with dynamic PORT for Render / Cloud Run / VPS
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PTS Server is running and listening on http://0.0.0.0:${PORT}`);
});
