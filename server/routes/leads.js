import { Router } from 'express';
import supabase from '../db/supabase.js';

const router = Router();

// In-memory fallback when Supabase is not configured
let inMemoryLeads = [];

// ============================================
// GET /api/leads - List all leads
// ============================================
router.get('/', async (req, res) => {
    try {
        const { status, website_status, category, search, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        if (supabase) {
            let query = supabase.from('leads').select('*', { count: 'exact' });

            if (status) query = query.eq('status', status);
            if (website_status) query = query.eq('website_status', website_status);
            if (category) query = query.ilike('category', `%${category}%`);
            if (search) query = query.or(`company_name.ilike.%${search}%,address.ilike.%${search}%`);

            query = query.order('scraped_at', { ascending: false });
            query = query.range(offset, offset + parseInt(limit) - 1);

            const { data, error, count } = await query;
            if (error) throw error;

            return res.json({ leads: data, total: count, page: parseInt(page), limit: parseInt(limit) });
        }

        // In-memory fallback
        let filtered = [...inMemoryLeads];
        if (status) filtered = filtered.filter(l => l.status === status);
        if (website_status) filtered = filtered.filter(l => l.website_status === website_status);
        if (search) filtered = filtered.filter(l =>
            l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            l.address?.toLowerCase().includes(search.toLowerCase())
        );

        return res.json({
            leads: filtered.slice(offset, offset + parseInt(limit)),
            total: filtered.length,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// ============================================
// GET /api/leads/:id - Get single lead
// ============================================
router.get('/:id', async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase.from('leads').select('*').eq('id', req.params.id).single();
            if (error) throw error;
            return res.json(data);
        }

        const lead = inMemoryLeads.find(l => l.id === req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        return res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
});

// ============================================
// PATCH /api/leads/:id - Update lead status
// ============================================
router.patch('/:id', async (req, res) => {
    try {
        const { status, note } = req.body;

        if (supabase) {
            const { data, error } = await supabase
                .from('leads')
                .update({ status })
                .eq('id', req.params.id)
                .select()
                .single();
            if (error) throw error;

            // Add log entry if note provided
            if (note) {
                await supabase.from('lead_logs').insert({
                    lead_id: req.params.id,
                    note: `Status changed to "${status}". ${note}`,
                });
            }

            return res.json(data);
        }

        // In-memory fallback
        const idx = inMemoryLeads.findIndex(l => l.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
        inMemoryLeads[idx] = { ...inMemoryLeads[idx], status, updated_at: new Date().toISOString() };
        return res.json(inMemoryLeads[idx]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// ============================================
// DELETE /api/leads/:id - Delete lead
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        if (supabase) {
            const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
            if (error) throw error;
            return res.json({ message: 'Lead deleted' });
        }

        inMemoryLeads = inMemoryLeads.filter(l => l.id !== req.params.id);
        return res.json({ message: 'Lead deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// ============================================
// POST /api/leads/bulk - Insert bulk leads (used by scraper)
// ============================================
router.post('/bulk', async (req, res) => {
    try {
        const { leads } = req.body;
        if (!leads || !Array.isArray(leads)) {
            return res.status(400).json({ error: 'leads array is required' });
        }

        if (supabase) {
            const { data, error } = await supabase.from('leads').insert(leads).select();
            if (error) throw error;
            return res.json({ inserted: data.length, leads: data });
        }

        // In-memory fallback
        const newLeads = leads.map((l, i) => ({
            ...l,
            id: `mem-${Date.now()}-${i}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }));
        inMemoryLeads.push(...newLeads);
        return res.json({ inserted: newLeads.length, leads: newLeads });
    } catch (error) {
        console.error('Error inserting leads:', error);
        res.status(500).json({ error: 'Failed to insert leads' });
    }
});

// Export the in-memory store for use by other routes
export { inMemoryLeads };
export default router;
