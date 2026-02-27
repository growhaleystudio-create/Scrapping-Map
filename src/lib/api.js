const API_BASE = 'http://localhost:3001/api';

/**
 * Start scraping and get results back directly
 */
export async function scrapeLeads(keyword, location, maxResults = 20) {
    const res = await fetch(`${API_BASE}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location, maxResults }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Scraping failed');
    }
    return res.json();
}

/**
 * Check if the local backend is running
 */
export async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Export leads array to CSV (client-side, no server needed)
 */
export function downloadCSV(leads) {
    if (!leads || leads.length === 0) {
        alert('Tidak ada data untuk di-export.');
        return;
    }

    const headers = ['Nama Bisnis', 'Kategori', 'Alamat', 'No. Telepon', 'Website', 'Status Website', 'Google Maps', 'Status Prospek'];
    const rows = leads.map(l => [
        l.company_name, l.category, l.address, l.phone_number,
        l.website_url || '', l.website_status, l.google_maps_url || '', l.status || 'new',
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
