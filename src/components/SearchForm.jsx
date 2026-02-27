import { useState } from 'react';
import { Search, MapPin, Loader2, Hash } from 'lucide-react';

export default function SearchForm({ onSearch, isScraping }) {
    const [keyword, setKeyword] = useState('Bengkel Las');
    const [location, setLocation] = useState('Surabaya');
    const [maxResults, setMaxResults] = useState(40);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!keyword || !location) return;
        onSearch(keyword, location, maxResults);
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                        Keyword Bisnis
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Cth: Bengkel Las, Restoran..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                            required
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                        Lokasi / Kota
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Cth: Surabaya, Jakarta Selatan..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                            required
                        />
                    </div>
                </div>
                <div className="w-full md:w-28">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                        Max Leads
                    </label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <select
                            value={maxResults}
                            onChange={(e) => setMaxResults(parseInt(e.target.value))}
                            className="w-full pl-10 pr-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm appearance-none cursor-pointer bg-white"
                        >
                            <option value={20}>20</option>
                            <option value={40}>40</option>
                            <option value={60}>60</option>
                            <option value={80}>80</option>
                            <option value={100}>100</option>
                            <option value={120}>120</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={isScraping}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 h-[42px] shadow-sm hover:shadow-md disabled:shadow-none cursor-pointer disabled:cursor-not-allowed text-sm"
                    >
                        {isScraping ? (
                            <><Loader2 size={18} className="animate-spin" /> Scraping...</>
                        ) : (
                            <><Search size={18} /> Cari Leads</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
