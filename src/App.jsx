import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import LeadsTable from './components/LeadsTable';
import EmptyState from './components/EmptyState';
import ScrapingProgress from './components/ScrapingProgress';
import {
  fetchLeads,
  updateLeadStatus,
  deleteLead,
  startScraping,
  checkJobStatus,
  exportCSV,
} from './lib/api';

const App = () => {
  const [leads, setLeads] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [showOnlyNoWebsite, setShowOnlyNoWebsite] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [error, setError] = useState(null);

  // Load leads from API on mount
  const loadLeads = useCallback(async () => {
    try {
      const data = await fetchLeads();
      setLeads(data.leads || []);
      setApiConnected(true);
    } catch {
      setApiConnected(false);
      console.log('⚠️ Backend not connected. Running in mock mode.');
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Poll job status when scraping
  useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const job = await checkJobStatus(jobId);
        setJobStatus(job.status);

        if (job.status === 'completed') {
          setIsScraping(false);
          loadLeads(); // Reload leads from API
          setTimeout(() => {
            setJobId(null);
            setJobStatus(null);
          }, 3000);
        } else if (job.status === 'failed') {
          setIsScraping(false);
          setError(job.error || 'Scraping failed');
        }
      } catch {
        // API not available
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus, loadLeads]);

  // Handle scraping
  const handleScrape = async (keyword, location, maxResults = 40) => {
    setIsScraping(true);
    setError(null);
    setJobStatus(null);

    if (apiConnected) {
      try {
        const result = await startScraping(keyword, location, maxResults);
        setJobId(result.jobId);
        setJobStatus('running');
      } catch {
        setError('Gagal memulai scraping. Pastikan backend berjalan.');
        setIsScraping(false);
      }
    } else {
      // Mock mode for development without backend
      setTimeout(() => {
        const mockData = [
          { id: `mock-${Date.now()}-1`, company_name: `${keyword} Jaya Abadi`, category: keyword, address: `Jl. Ahmad Yani No. 10, ${location}`, phone_number: '081234567890', website_url: null, website_status: 'none', google_maps_url: '#', status: 'new', scraped_at: new Date().toISOString() },
          { id: `mock-${Date.now()}-2`, company_name: `${keyword} Makmur ${location}`, category: keyword, address: `Jl. Sudirman 45, ${location}`, phone_number: '085678901234', website_url: 'https://bengkelmakmur.com', website_status: 'active', google_maps_url: '#', status: 'new', scraped_at: new Date().toISOString() },
          { id: `mock-${Date.now()}-3`, company_name: `Karya ${keyword} Bersama`, category: keyword, address: `Kawasan Industri Rungkut, ${location}`, phone_number: '089912345678', website_url: null, website_status: 'none', google_maps_url: '#', status: 'contacted', scraped_at: new Date().toISOString() },
          { id: `mock-${Date.now()}-4`, company_name: `Sumber ${keyword}`, category: keyword, address: `Jl. Diponegoro 12, ${location}`, phone_number: '081122334455', website_url: 'http://sumber-las-sby.co.id', website_status: 'dead', google_maps_url: '#', status: 'new', scraped_at: new Date().toISOString() },
          { id: `mock-${Date.now()}-5`, company_name: `${keyword} Pak Kumis`, category: keyword, address: `Pasar Lama ${location}`, phone_number: '', website_url: null, website_status: 'none', google_maps_url: '#', status: 'rejected', scraped_at: new Date().toISOString() },
        ];
        setLeads(prev => [...mockData, ...prev]);
        setIsScraping(false);
      }, 2000);
    }
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    if (apiConnected) {
      try {
        await updateLeadStatus(id, newStatus);
      } catch {
        console.error('Failed to update status');
      }
    }
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (apiConnected) {
      try {
        await deleteLead(id);
      } catch {
        console.error('Failed to delete lead');
      }
    }
    setLeads(leads.filter(lead => lead.id !== id));
  };

  // Handle export
  const handleExport = () => {
    if (apiConnected) {
      exportCSV({ website_status: showOnlyNoWebsite ? 'none' : undefined });
    } else {
      // Fallback: create CSV client-side
      const headers = ['Nama Bisnis', 'Kategori', 'Alamat', 'No. Telepon', 'Website', 'Status Website', 'Status Prospek'];
      const rows = filteredLeads.map(l => [
        l.company_name, l.category, l.address, l.phone_number,
        l.website_url || '', l.website_status, l.status,
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Apply filters
  let filteredLeads = [...leads];
  if (showOnlyNoWebsite) {
    filteredLeads = filteredLeads.filter(l => l.website_status === 'none' || l.website_status === 'dead');
  }
  if (statusFilter) {
    filteredLeads = filteredLeads.filter(l => l.status === statusFilter);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        <Header leadsCount={leads.length} onExport={handleExport} />

        {/* API Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          {apiConnected ? 'Terhubung ke API' : 'Mode Offline (Mock Data)'}
        </div>

        <SearchForm onSearch={handleScrape} isScraping={isScraping} />

        <ScrapingProgress jobId={jobId} status={jobStatus} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {leads.length > 0 && (
          <LeadsTable
            leads={leads}
            filteredLeads={filteredLeads}
            showOnlyNoWebsite={showOnlyNoWebsite}
            setShowOnlyNoWebsite={setShowOnlyNoWebsite}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        )}

        {!isScraping && leads.length === 0 && <EmptyState />}
      </div>
    </div>
  );
};

export default App;
