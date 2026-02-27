const STATUS_OPTIONS = [
    { value: 'new', label: '🆕 Belum Dihubungi', bg: 'bg-gray-100 border-gray-300 text-gray-700' },
    { value: 'contacted', label: '💬 Sudah Di-WA', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
    { value: 'interested', label: '🤝 Tertarik', bg: 'bg-purple-50 border-purple-200 text-purple-700' },
    { value: 'closing', label: '✅ Closing (Deal)', bg: 'bg-green-50 border-green-200 text-green-700' },
    { value: 'rejected', label: '❌ Ditolak', bg: 'bg-red-50 border-red-200 text-red-700' },
    { value: 'closed', label: '🏁 Selesai', bg: 'bg-gray-50 border-gray-400 text-gray-700' },
];

export default function LeadStatusSelect({ value, onChange }) {
    const currentStatus = STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`text-xs rounded-lg border py-1.5 pl-2 pr-6 outline-none appearance-none cursor-pointer font-medium transition-colors ${currentStatus.bg}`}
        >
            {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}
