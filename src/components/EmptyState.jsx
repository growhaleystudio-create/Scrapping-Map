import { Search } from 'lucide-react';

export default function EmptyState() {
    return (
        <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-xl">
            <div className="bg-gray-100 rounded-full p-4 w-fit mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Belum ada data</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                Masukkan keyword bisnis dan kota, lalu klik <strong>"Cari Leads"</strong> untuk mulai
                mengekstrak data dari Google Maps.
            </p>
        </div>
    );
}
