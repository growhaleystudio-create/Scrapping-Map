import { Router } from 'express';
import { scrapeGoogleMaps } from '../scraper/google-maps.js';
import { batchCheckWebsites } from '../services/website-checker.js';
import supabase from '../db/supabase.js';
import { inMemoryLeads } from './leads.js';

const router = Router();

// Track active scraping jobs
const activeJobs = new Map();

// ============================================
// POST /api/scraper/start - Start scraping
// ============================================
router.post('/start', async (req, res) => {
    try {
        const { keyword, location, maxResults = 20 } = req.body;

        if (!keyword || !location) {
            return res.status(400).json({ error: 'keyword and location are required' });
        }

        const jobId = `job-${Date.now()}`;

        // Set job status
        activeJobs.set(jobId, {
            status: 'running',
            keyword,
            location,
            startedAt: new Date().toISOString(),
            results: [],
            progress: 0,
        });

        // Respond immediately with job ID
        res.json({ jobId, message: 'Scraping started' });

        // Run scraping in background
        try {
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

            // Save to database or in-memory
            if (supabase) {
                const { data, error } = await supabase.from('leads').insert(results).select();
                if (error) {
                    console.error('DB insert error:', error);
                    // Still mark as completed with scraped results
                    activeJobs.set(jobId, { ...activeJobs.get(jobId), status: 'completed', results, resultCount: results.length });
                } else {
                    activeJobs.set(jobId, { ...activeJobs.get(jobId), status: 'completed', results: data, resultCount: data.length });
                }
            } else {
                const savedLeads = results.map((l, i) => ({
                    ...l,
                    id: `mem-${Date.now()}-${i}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }));
                inMemoryLeads.push(...savedLeads);
                activeJobs.set(jobId, { ...activeJobs.get(jobId), status: 'completed', results: savedLeads });
            }

            console.log(`✅ Job ${jobId} completed with ${results.length} leads`);
        } catch (err) {
            console.error(`❌ Job ${jobId} failed:`, err.message);
            activeJobs.set(jobId, { ...activeJobs.get(jobId), status: 'failed', error: err.message });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to start scraping' });
    }
});

// ============================================
// GET /api/scraper/status/:jobId - Check job status
// ============================================
router.get('/status/:jobId', (req, res) => {
    const job = activeJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

// ============================================
// GET /api/scraper/jobs - List all jobs
// ============================================
router.get('/jobs', (req, res) => {
    const jobs = Array.from(activeJobs.entries()).map(([id, job]) => ({
        id,
        ...job,
        results: undefined, // Don't send full results in list
        resultCount: job.results?.length || 0,
    }));
    res.json(jobs);
});

export default router;
