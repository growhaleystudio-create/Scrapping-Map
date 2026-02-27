import { CheckCircle2, XCircle, Globe, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG = {
    active: {
        icon: Globe,
        label: 'Website Aktif',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    dead: {
        icon: AlertTriangle,
        label: 'Domain Mati',
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    none: {
        icon: XCircle,
        label: 'Belum Punya',
        className: 'bg-red-50 text-red-700 border border-red-200',
    },
    unknown: {
        icon: Globe,
        label: 'Belum Dicek',
        className: 'bg-gray-50 text-gray-600 border border-gray-200',
    },
};

export default function WebsiteStatusBadge({ status, url }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
    const Icon = config.icon;

    if (status === 'active' && url) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className} hover:opacity-80 transition-opacity`}
            >
                <Icon size={12} />
                {config.label}
            </a>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
}
