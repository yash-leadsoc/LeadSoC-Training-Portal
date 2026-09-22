require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const pptSubmissionRoutes = require('./routes/pptSubmission');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// health check
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'leadsoc-portal', time: new Date() }));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/domains', require('./routes/domains'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/writeups', require('./routes/writeups'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/ppt-submissions', pptSubmissionRoutes);
app.use('/api/qa', require('./routes/qa'));


// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// error handler
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  });
