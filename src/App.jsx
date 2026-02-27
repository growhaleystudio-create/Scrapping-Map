import { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import LeadsTable from './components/LeadsTable';
import EmptyState from './components/EmptyState';
import { scrapeLeads, checkHealth, downloadCSV } from './lib/api';

// LocalStorage helpers
const STORAGE_KEY = 'leadfinder_leads';

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(leads) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {
    console.warn('localStorage full or unavailable');
  }
}

const App = () => {
  const [leads, setLeads] = useState(() => loadFromStorage());
  const [isScraping, setIsScraping] = useState(false);
  const [showOnlyNoWebsite, setShowOnlyNoWebsite] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [serverOnline, setServerOnline] = useState(false);
  const [error, setError] = useState(null);

  // Persist leads to localStorage whenever they change
  useEffect(() => {
    saveToStorage(leads);
  }, [leads]);

  // Check if backend is running
  useEffect(() => {
    checkHealth().then(setServerOnline);
  }, []);

  // Handle scraping
  const handleScrape = async (keyword, location, maxResults = 40) => {
    if (!serverOnline) {
      setError('Scraper engine belum jalan. Jalankan "npm run dev" di terminal.');
      return;
    }

    setIsScraping(true);
    setError(null);

    try {
      const data = await scrapeLeads(keyword, location, maxResults);
      setLeads(prev => [...data.leads, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScraping(false);
    }
  };

  // Handle status change — persisted via localStorage
  const handleStatusChange = (id, newStatus) => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
  };

  // Handle delete — persisted via localStorage
  const handleDelete = (id) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  // Handle CSV export
  const handleExport = () => {
    downloadCSV(filteredLeads);
  };

  // Handle clear all
  const handleClear = () => {
    if (confirm('Hapus semua data dari tabel?')) {
      setLeads([]);
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

        {/* Server Status */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          {serverOnline ? 'Scraper engine siap' : 'Scraper offline — jalankan: npm run dev'}
          {leads.length > 0 && (
            <span className="ml-auto text-gray-400">
              {leads.length} leads tersimpan •
              <button onClick={handleClear} className="text-red-400 hover:text-red-600 ml-1 cursor-pointer">
                Hapus semua
              </button>
            </span>
          )}
        </div>

        <SearchForm onSearch={handleScrape} isScraping={isScraping} />

        {isScraping && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <p className="font-semibold text-blue-900">Sedang Scraping...</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Bot sedang mengekstrak data dari Google Maps. Proses ini bisa memakan waktu 1-5 menit.
              </p>
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

        {!isScraping && leads.length === 0 && <EmptyState />}
      </div>
    </div>
  );
};

export default App;
