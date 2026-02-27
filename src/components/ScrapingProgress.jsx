import { Loader2 } from 'lucide-react';

export default function ScrapingProgress({ jobId, status }) {
    if (!jobId) return null;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
                {status === 'running' && (
                    <>
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Loader2 size={20} className="animate-spin text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-blue-900">Sedang Scraping...</p>
                            <p className="text-sm text-blue-700 mt-0.5">
                                Bot sedang mengekstrak data dari Google Maps. Proses ini bisa memakan waktu 1-3 menit.
                            </p>
                        </div>
                    </>
                )}
                {status === 'completed' && (
                    <div>
                        <p className="font-semibold text-emerald-800">✅ Scraping Selesai!</p>
                        <p className="text-sm text-emerald-700 mt-0.5">Data berhasil diambil dan sudah tersimpan.</p>
                    </div>
                )}
                {status === 'failed' && (
                    <div>
                        <p className="font-semibold text-red-800">❌ Scraping Gagal</p>
                        <p className="text-sm text-red-700 mt-0.5">Terjadi kesalahan saat scraping. Silakan coba lagi.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
