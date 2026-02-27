import { Phone, Trash2, ExternalLink } from 'lucide-react';
import WebsiteStatusBadge from './WebsiteStatusBadge';
import LeadStatusSelect from './LeadStatusSelect';

export default function LeadsTable({
    leads,
    filteredLeads,
    showOnlyNoWebsite,
    setShowOnlyNoWebsite,
    onStatusChange,
    onDelete,
    statusFilter,
    setStatusFilter,
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-semibold text-gray-800">
                        Hasil Pencarian
                        <span className="ml-1.5 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {filteredLeads.length}
                        </span>
                    </h2>

                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors select-none">
                        <input
                            type="checkbox"
                            checked={showOnlyNoWebsite}
                            onChange={(e) => setShowOnlyNoWebsite(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        Tanpa Website
                    </label>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs bg-white border border-gray-300 rounded-full px-3 py-1.5 outline-none cursor-pointer shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <option value="">Semua Status</option>
                        <option value="new">🆕 Belum Dihubungi</option>
                        <option value="contacted">💬 Sudah Di-WA</option>
                        <option value="interested">🤝 Tertarik</option>
                        <option value="closing">✅ Closing</option>
                        <option value="rejected">❌ Ditolak</option>
                        <option value="closed">🏁 Selesai</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-100/80 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Nama Bisnis</th>
                            <th className="px-4 py-3 font-semibold">Kontak & Alamat</th>
                            <th className="px-4 py-3 font-semibold">Status Website</th>
                            <th className="px-4 py-3 font-semibold">Status Prospek</th>
                            <th className="px-4 py-3 font-semibold w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map((lead) => (
                            <tr key={lead.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{lead.company_name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{lead.category}</div>
                                    {lead.google_maps_url && (
                                        <a
                                            href={lead.google_maps_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 transition-colors"
                                        >
                                            <ExternalLink size={10} />
                                            Maps
                                        </a>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-gray-900 mb-1">
                                        <Phone size={14} className="text-green-600 shrink-0" />
                                        {lead.phone_number && lead.phone_number !== '-' ? (
                                            <a
                                                href={`https://wa.me/62${lead.phone_number.replace(/^0/, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:underline font-medium text-sm"
                                            >
                                                {lead.phone_number}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Tidak ada no HP</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[280px]" title={lead.address}>
                                        {lead.address || '-'}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <WebsiteStatusBadge status={lead.website_status} url={lead.website_url} />
                                </td>
                                <td className="px-4 py-3">
                                    <LeadStatusSelect value={lead.status} onChange={(newStatus) => onStatusChange(lead.id, newStatus)} />
                                </td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => onDelete(lead.id)}
                                        className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                        title="Hapus lead"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredLeads.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
                                    Tidak ada data yang sesuai dengan filter saat ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
