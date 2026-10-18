import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export function StatCard({ icon: Icon, color = 'purple', label, value }) {
    return (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className={`stat-card-icon ${color}`}>
                    <Icon size={22} />
                </div>
            </div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
        </div>
    );
}

const BADGE_VARIANTS = {
    ACCEPTED: 'success',
    ACTIVE: 'success',
    APPROVED: 'success',
    PENDING_VERIFICATION: 'warning',
    NOT_SUBMITTED: 'default',
    REJECTED: 'danger',
    DELETED: 'danger',
    SUSPENDED: 'danger',
};

export function StatusBadge({ status }) {
    const variant = BADGE_VARIANTS[status] || 'info';
    return <span className={`badge badge-${variant}`}>{String(status || '—').replace(/_/g, ' ')}</span>;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
    return (
        <div className="header-search" style={{ width: '100%' }}>
            <Search size={16} />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ width: '100%' }}
            />
        </div>
    );
}

export function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let p = start; p <= end; p++) pages.push(p);

    return (
        <div className="pagination">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
                <ChevronLeft size={16} />
            </button>
            {pages.map((p) => (
                <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => onChange(p)}>
                    {p}
                </button>
            ))}
            <button className="pagination-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

export function EmptyState({ icon: Icon, title, subtitle }) {
    return (
        <div className="empty-state">
            {Icon && <Icon />}
            <h4>{title}</h4>
            {subtitle && <p>{subtitle}</p>}
        </div>
    );
}

export function Loading() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    );
}

/** A table value, or a clear "Not provided" marker when it is empty — so gaps in the data are visible, not blank. */
export function Value({ children, missing = 'Not provided' }) {
    const empty = children === undefined || children === null || String(children).trim() === '' || children === '—';
    if (!empty) return <>{children}</>;
    return <span className="badge badge-warning" style={{ fontWeight: 500 }}>{missing}</span>;
}
