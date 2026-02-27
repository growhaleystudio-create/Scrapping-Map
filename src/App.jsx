import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import LeadsTable from './components/LeadsTable';
import EmptyState from './components/EmptyState';
import ScrapingProgress from './components/ScrapingProgress';
import {
  isConnected,
  fetchLeads,
  updateLeadStatus,
  deleteLead,
  exportCSV,
} from './lib/api';

const App = () => {
  const [leads, setLeads] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [showOnlyNoWebsite, setShowOnlyNoWebsite] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState(null);
  const [scrapingMessage, setScrapingMessage] = useState(null);

  // Load leads from Supabase on mount
  const loadLeads = useCallback(async () => {
    try {
      const connected = isConnected();
      setDbConnected(connected);
      if (!connected) return;

      const data = await fetchLeads();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Gagal memuat data leads.');
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Handle scraping — triggers local CLI reminder
  const handleScrape = async (keyword, location, maxResults = 40) => {
    setScrapingMessage({ keyword, location, maxResults });
  };

  const dismissScrapingMessage = () => {
    setScrapingMessage(null);
    loadLeads(); // Reload data after user runs CLI
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    // Optimistic update
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));

    if (dbConnected) {
      try {
        await updateLeadStatus(id, newStatus);
      } catch {
        console.error('Failed to update status');
        loadLeads(); // Revert on error
      }
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    setLeads(leads.filter(lead => lead.id !== id));

    if (dbConnected) {
      try {
        await deleteLead(id);
      } catch {
        console.error('Failed to delete lead');
        loadLeads(); // Revert on error
      }
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await exportCSV({
        website_status: showOnlyNoWebsite ? 'none' : undefined,
        status: statusFilter || undefined,
      });
    } catch (err) {
      setError('Gagal export CSV: ' + err.message);
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

        {/* DB Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          {dbConnected ? `Terhubung ke Database — ${leads.length} leads tersimpan` : 'Database tidak terhubung'}
        </div>

        <SearchForm onSearch={handleScrape} isScraping={isScraping} />

        {/* Scraping CLI Instruction */}
        {scrapingMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
            <p className="font-semibold text-blue-900">🔍 Jalankan Scraping dari Terminal</p>
            <p className="text-sm text-blue-800">
              Scraping membutuhkan Playwright browser yang berjalan di komputer lokal. Buka terminal dan jalankan:
            </p>
            <div className="bg-blue-950 text-blue-100 rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
              npm run scrape -- --keyword "{scrapingMessage.keyword}" --location "{scrapingMessage.location}" --max {scrapingMessage.maxResults}
            </div>
            <div className="flex gap-2">
              <button
                onClick={dismissScrapingMessage}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer font-medium"
              >
                ✅ Sudah selesai, Refresh Data
              </button>
              <button
                onClick={() => setScrapingMessage(null)}
                className="text-sm text-blue-700 hover:text-blue-900 px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex justify-between items-center">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 cursor-pointer">✕</button>
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

        {!isScraping && leads.length === 0 && !scrapingMessage && <EmptyState />}
      </div>
    </div>
  );
};

export default App;
