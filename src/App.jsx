import { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import LeadsTable from './components/LeadsTable';
import EmptyState from './components/EmptyState';
import ScrapingProgress from './components/ScrapingProgress';
import { scrapeLeads, checkHealth, downloadCSV } from './lib/api';

const App = () => {
  const [leads, setLeads] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [showOnlyNoWebsite, setShowOnlyNoWebsite] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [serverOnline, setServerOnline] = useState(false);
  const [error, setError] = useState(null);

  // Check if backend is running
  useEffect(() => {
    checkHealth().then(setServerOnline);
  }, []);

  // Handle scraping — calls local backend, stores in React state
  const handleScrape = async (keyword, location, maxResults = 40) => {
    if (!serverOnline) {
      setError('Backend belum jalan. Jalankan "npm run server" di terminal lain.');
      return;
    }

    setIsScraping(true);
    setError(null);

    try {
      const data = await scrapeLeads(keyword, location, maxResults);
      setLeads(prev => [...data.leads, ...prev]); // Prepend new results
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScraping(false);
    }
  };

  // Handle status change (in-memory only)
  const handleStatusChange = (id, newStatus) => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
  };

  // Handle delete (in-memory only)
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
          <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          {serverOnline ? 'Scraper engine siap' : 'Scraper offline — jalankan: npm run server'}
          {leads.length > 0 && (
            <span className="ml-auto text-gray-400">
              {leads.length} leads di-memory •
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
                Bot sedang mengekstrak data dari Google Maps. Proses ini bisa memakan waktu 1-5 menit tergantung jumlah leads.
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
