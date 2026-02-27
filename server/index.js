import express from 'express';
import cors from 'cors';
import { scrapeGoogleMaps } from './scraper/google-maps.js';
import { batchCheckWebsites } from './services/website-checker.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================
// POST /api/scrape - Scrape and return results directly
// ============================================
app.post('/api/scrape', async (req, res) => {
    try {
        const { keyword, location, maxResults = 20 } = req.body;

        if (!keyword || !location) {
            return res.status(400).json({ error: 'keyword and location are required' });
        }

        console.log(`\n🔍 Scraping: "${keyword}" di "${location}" (max: ${maxResults})`);

        // Scrape Google Maps
        const results = await scrapeGoogleMaps(keyword, location, maxResults);

        // Check website statuses
        const leadsWithUrls = results.filter(r => r.website_url);
        if (leadsWithUrls.length > 0) {
            console.log(`🌐 Checking ${leadsWithUrls.length} website statuses...`);
            const statusResults = await batchCheckWebsites(leadsWithUrls);
            statusResults.forEach(sr => {
                const lead = results.find(r => r.website_url === sr.website_url);
                if (lead) lead.website_status = sr.status;
            });
        }

        // Add unique IDs
        const leads = results.map((r, i) => ({
            ...r,
            id: `lead-${Date.now()}-${i}`,
        }));

        console.log(`✅ Done! Returning ${leads.length} leads\n`);
        res.json({ leads, total: leads.length });
    } catch (error) {
        console.error('❌ Scrape error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Lead Finder API on http://localhost:${PORT}`);
    console.log(`   Endpoint: POST http://localhost:${PORT}/api/scrape\n`);
});
