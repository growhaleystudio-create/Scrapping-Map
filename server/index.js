import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import leadsRouter from './routes/leads.js';
import scraperRouter from './routes/scraper.js';
import exportRouter from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
    origin: corsOrigin ? corsOrigin.split(',').map(s => s.trim()) : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/leads', leadsRouter);
app.use('/api/scraper', scraperRouter);
app.use('/api/export', exportRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Lead Finder API running on http://localhost:${PORT}`);
    console.log(`   📊 Leads API:    http://localhost:${PORT}/api/leads`);
    console.log(`   🔍 Scraper API:  http://localhost:${PORT}/api/scraper/start`);
    console.log(`   📥 Export CSV:   http://localhost:${PORT}/api/export/csv`);
    console.log(`   💚 Health Check: http://localhost:${PORT}/api/health\n`);
});

export default app;
