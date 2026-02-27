import supabase from './supabase';

/**
 * Check if Supabase is connected
 */
export function isConnected() {
    return !!supabase;
}

/**
 * Fetch leads from Supabase
 */
export async function fetchLeads({ status, website_status, search, page = 1, limit = 50 } = {}) {
    if (!supabase) return { leads: [], total: 0, page, limit };

    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (website_status) query = query.eq('website_status', website_status);
    if (search) query = query.or(`company_name.ilike.%${search}%,address.ilike.%${search}%`);

    const offset = (page - 1) * limit;
    query = query.order('scraped_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { leads: data || [], total: count || 0, page, limit };
}

/**
 * Update lead status
 */
export async function updateLeadStatus(id, newStatus, note = '') {
    if (!supabase) throw new Error('Not connected');

    const { data, error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;

    // Add log entry if note provided
    if (note) {
        await supabase.from('lead_logs').insert({
            lead_id: id,
            note: `Status changed to "${newStatus}". ${note}`,
        });
    }

    return data;
}

/**
 * Delete a lead
 */
export async function deleteLead(id) {
    if (!supabase) throw new Error('Not connected');

    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Lead deleted' };
}

/**
 * Export leads as CSV (client-side)
 */
export async function exportCSV({ status, website_status } = {}) {
    let leads = [];

    if (supabase) {
        let query = supabase.from('leads').select('*');
        if (status) query = query.eq('status', status);
        if (website_status) query = query.eq('website_status', website_status);
        query = query.order('scraped_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        leads = data || [];
    }

    if (leads.length === 0) {
        alert('Tidak ada data untuk di-export.');
        return;
    }

    const headers = ['Nama Bisnis', 'Kategori', 'Alamat', 'No. Telepon', 'Website', 'Status Website', 'Google Maps', 'Status Prospek', 'Tanggal Scraping'];
    const rows = leads.map(l => [
        l.company_name, l.category, l.address, l.phone_number,
        l.website_url || '', l.website_status, l.google_maps_url || '', l.status, l.scraped_at,
    ]);
    const csv = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
