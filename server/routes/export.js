import { Router } from 'express';
import { Parser } from 'json2csv';
import supabase from '../db/supabase.js';
import { inMemoryLeads } from './leads.js';

const router = Router();

// ============================================
// GET /api/export/csv - Export leads to CSV
// ============================================
router.get('/csv', async (req, res) => {
    try {
        const { status, website_status } = req.query;
        let leads;

        if (supabase) {
            let query = supabase.from('leads').select('*');
            if (status) query = query.eq('status', status);
            if (website_status) query = query.eq('website_status', website_status);
            query = query.order('scraped_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            leads = data;
        } else {
            leads = [...inMemoryLeads];
            if (status) leads = leads.filter(l => l.status === status);
            if (website_status) leads = leads.filter(l => l.website_status === website_status);
        }

        if (!leads || leads.length === 0) {
            return res.status(404).json({ error: 'No leads found to export' });
        }

        const fields = [
            { label: 'Nama Bisnis', value: 'company_name' },
            { label: 'Kategori', value: 'category' },
            { label: 'Alamat', value: 'address' },
            { label: 'No. Telepon', value: 'phone_number' },
            { label: 'Website', value: 'website_url' },
            { label: 'Status Website', value: 'website_status' },
            { label: 'Google Maps', value: 'google_maps_url' },
            { label: 'Status Prospek', value: 'status' },
            { label: 'Tanggal Scraping', value: 'scraped_at' },
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(leads);

        const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Add BOM for Excel compatibility with Indonesian characters
        res.send('\uFEFF' + csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export leads' });
    }
});

export default router;
