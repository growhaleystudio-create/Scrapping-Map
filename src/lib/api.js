const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

/**
 * Fetch leads from the API
 */
export async function fetchLeads({ status, website_status, search, page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (website_status) params.set('website_status', website_status);
    if (search) params.set('search', search);
    params.set('page', page);
    params.set('limit', limit);

    const res = await fetch(`${API_BASE}/leads?${params}`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
}

/**
 * Update lead status
 */
export async function updateLeadStatus(id, status, note = '') {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
    });
    if (!res.ok) throw new Error('Failed to update lead');
    return res.json();
}

/**
 * Delete a lead
 */
export async function deleteLead(id) {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete lead');
    return res.json();
}

/**
 * Start a scraping job
 */
export async function startScraping(keyword, location, maxResults = 20) {
    const res = await fetch(`${API_BASE}/scraper/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location, maxResults }),
    });
    if (!res.ok) throw new Error('Failed to start scraping');
    return res.json();
}

/**
 * Check scraping job status
 */
export async function checkJobStatus(jobId) {
    const res = await fetch(`${API_BASE}/scraper/status/${jobId}`);
    if (!res.ok) throw new Error('Failed to check job status');
    return res.json();
}

/**
 * Export leads as CSV (triggers download)
 */
export function exportCSV({ status, website_status } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (website_status) params.set('website_status', website_status);
    window.open(`${API_BASE}/export/csv?${params}`, '_blank');
}

/**
 * Health check
 */
export async function healthCheck() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
}
