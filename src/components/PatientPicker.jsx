import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { patientAPI } from '../lib/api';

/** Search-as-you-type patient selector. Calls onSelect({ id, name, uniqueUserId, phone }). */
export default function PatientPicker({ selected, onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        const handle = setTimeout(() => {
            patientAPI.getAll({ search: query, limit: 8 })
                .then((res) => setResults(res.data.data))
                .finally(() => setLoading(false));
        }, 300);
        return () => clearTimeout(handle);
    }, [query]);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={containerRef}>
            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 40 }}
                    placeholder="Search patient by name, phone, or Ayuxa ID…"
                    value={selected ? `${selected.name} (${selected.uniqueUserId})` : query}
                    onChange={(e) => {
                        // Editing while a patient is selected: the field was showing a
                        // formatted label, not free text — discard it and start a fresh
                        // query rather than treating the mutated label as search input.
                        const nextQuery = selected ? '' : e.target.value;
                        setQuery(nextQuery);
                        onSelect(null);
                        setOpen(true);
                    }}
                    onFocus={() => { if (selected) { setQuery(''); onSelect(null); } setOpen(true); }}
                />
            </div>
            {open && (query.trim() || loading) && !selected && (
                <div
                    className="card"
                    style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
                        maxHeight: 260, overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    {loading ? (
                        <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Searching…</div>
                    ) : results.length === 0 ? (
                        <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No patients found.</div>
                    ) : (
                        results.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => { onSelect(p); setQuery(''); setOpen(false); }}
                                style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name || 'Unnamed'}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.uniqueUserId} · {p.phone}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
