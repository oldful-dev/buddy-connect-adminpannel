import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

export function StatCard({ icon: Icon, color = 'purple', label, value, to }) {
    const navigate = useNavigate();
    const clickable = !!to;
    return (
        <div
            className="stat-card"
            role={clickable ? 'link' : undefined}
            tabIndex={clickable ? 0 : undefined}
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={clickable ? () => navigate(to) : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter') navigate(to); } : undefined}
            title={clickable ? `Open ${label}` : undefined}
        >
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

export function ErrorState({ message = 'Something went wrong', onRetry }) {
    return (
        <div className="empty-state">
            <h4>{message}</h4>
            {onRetry && <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={onRetry}>Try again</button>}
        </div>
    );
}

export function Modal({ title, onClose, children, footer }) {
    return (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="btn btn-icon btn-secondary" onClick={onClose} aria-label="Close"><X size={16} /></button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, busy = false, error, onConfirm, onCancel }) {
    return (
        <Modal
            title={title}
            onClose={onCancel}
            footer={(
                <>
                    <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
                    <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </>
            )}
        >
            <p style={{ margin: 0 }}>{message}</p>
            {error && <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginTop: 12 }}>{error}</div>}
        </Modal>
    );
}

/** Maps link for an address string. */
export function MapLink({ address }) {
    if (!address) return null;
    return (
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, marginLeft: 6 }}>
            Map
        </a>
    );
}

export const apiError = (err, fallback = 'Something went wrong') => err?.response?.data?.message || fallback;
