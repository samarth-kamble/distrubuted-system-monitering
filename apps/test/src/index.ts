import express from 'express';

const app = express();
const PORT = process.env.PORT || 9000;

let isHealthy = true;

app.get('/up', (req, res) => {
  res.status(200).json({ status: 'HEALTHY', message: 'Service is fully functional' });
});

app.get('/down', (req, res) => {
  res.status(500).json({ status: 'DOWN', error: 'Internal Server Error' });
});

app.get('/degraded', async (req, res) => {
  // Delay response by 2 seconds (2000ms) to trigger degraded latency threshold (1500ms)
  await new Promise((resolve) => setTimeout(resolve, 2000));
  res.status(200).json({ status: 'DEGRADED', message: 'Delayed response' });
});

app.get('/toggle-status', (req, res) => {
  res.status(isHealthy ? 200 : 500).json({ status: isHealthy ? 'HEALTHY' : 'DOWN' });
});

app.post('/toggle', (req, res) => {
  isHealthy = !isHealthy;
  res.status(200).json({ message: `Service health toggled. Current state is: ${isHealthy ? 'HEALTHY' : 'DOWN'}` });
});

app.listen(PORT, () => {
  console.log(`🚀 Observability Test Server running at http://localhost:${PORT}`);
  console.log(`   - GET /up : Instant 200 OK`);
  console.log(`   - GET /down : Instant 500 Internal Error`);
  console.log(`   - GET /degraded : Delayed response (2s)`);
  console.log(`   - GET /toggle-status : Returns togglable health status (200/500)`);
  console.log(`   - POST /toggle : Toggle the state of /toggle-status`);
});
