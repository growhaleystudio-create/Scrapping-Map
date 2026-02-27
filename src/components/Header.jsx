import { Building2 } from 'lucide-react';
import { Download } from 'lucide-react';

export default function Header({ leadsCount, onExport }) {
    return (
        <div className="flex justify-between items-center pb-5 border-b border-gray-200/60">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <Building2 size={22} />
                    </div>
                    Lead Finder Pro
                </h1>
                <p className="text-sm text-gray-500 mt-1 ml-[42px]">Google Maps Scraper Dashboard</p>
            </div>
            {leadsCount > 0 && (
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            )}
        </div>
    );
}
