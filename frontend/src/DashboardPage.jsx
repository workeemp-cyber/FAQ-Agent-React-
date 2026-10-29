import { useCallback, useEffect, useMemo, useState } from 'react'
import { getQueries, setQueryChecked } from './api.js'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DashboardPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState({})

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try { setItems(await getQueries()); setError('') }
    catch (err) { setError(`${err.message}. Check that the FastAPI backend is running.`) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh(); const timer = window.setInterval(() => refresh(true), 10000); return () => window.clearInterval(timer) }, [refresh])

  const counts = useMemo(() => ({ total: items.length, done: items.filter((x) => x.checked).length, open: items.filter((x) => !x.checked).length, escalated: items.filter((x) => x.escalated).length }), [items])
  const visible = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === 'all' || (filter === 'open' && !item.checked) || (filter === 'done' && item.checked) || (filter === 'escalated' && item.escalated)
    const q = search.toLowerCase().trim()
    const matchesSearch = !q || `${item.question} ${item.answer} ${item.session_id}`.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  }).slice().reverse(), [items, filter, search])

  async function toggle(item, checked) {
    setUpdating((state) => ({ ...state, [item.id]: true }))
    try {
      const updated = await setQueryChecked(item.id, checked)
      setItems((state) => state.map((row) => row.id === item.id ? updated : row))
      setError('')
    } catch (err) { setError(`Could not update query: ${err.message}`) }
    finally { setUpdating((state) => ({ ...state, [item.id]: false })) }
  }

  return <div className="page-wrap dashboard-page">
    <header className="page-header"><div><div className="eyebrow">OPERATIONS <span className="eyebrow-line" /></div><h1>Query dashboard</h1><p>Review customer questions, track escalations, and close out handled requests.</p></div><button className="button ghost" onClick={() => refresh()} disabled={loading}>↻ Refresh</button></header>
    <section className="stat-grid">
      <Stat label="Total queries" value={counts.total} icon="▤" detail="All recorded questions" />
      <Stat label="Awaiting review" value={counts.open} icon="◷" detail="Still needs attention" accent="amber" />
      <Stat label="Resolved" value={counts.done} icon="✓" detail="Marked as handled" accent="green" />
      <Stat label="Escalated" value={counts.escalated} icon="↗" detail="Flagged for a human" accent="purple" />
    </section>
    {error && <div className="notice error">{error}</div>}
    <section className="panel inbox-panel">
      <div className="inbox-heading"><div><h2>Support inbox</h2><p>Automatically refreshes every 10 seconds.</p></div><span className="live-pill"><i className="online-dot"/> Live updates</span></div>
      <div className="table-toolbar"><div className="filter-tabs" role="group" aria-label="Filter queries">{[['all','All'],['open','Open'],['escalated','Escalated'],['done','Resolved']].map(([key,label]) => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div><label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" aria-label="Search questions"/></label></div>
      <div className="table-scroll"><table className="query-table"><thead><tr><th>STATUS</th><th>CUSTOMER QUESTION</th><th>AI RESPONSE</th><th>RECEIVED</th><th>RESOLVED</th></tr></thead><tbody>
        {loading && !items.length ? <tr><td colSpan="5" className="table-empty">Loading queries…</td></tr> : visible.length === 0 ? <tr><td colSpan="5" className="table-empty"><span className="empty-icon">⌕</span><strong>No queries found</strong><span>Try another filter, or start a chat to create a query.</span></td></tr> : visible.map((item) => <tr key={item.id}>
          <td><span className={`status-tag ${item.escalated ? 'escalated' : item.checked ? 'resolved' : 'open'}`}><i/>{item.escalated ? 'Escalated' : item.checked ? 'Resolved' : 'Open'}</span></td>
          <td className="question-cell"><strong>{item.question}</strong><small>Session {String(item.session_id || '').slice(0, 8)}</small>{item.reason && item.escalated && <small className="reason-text">{item.reason}</small>}</td>
          <td className="answer-cell">{item.answer}</td><td className="date-cell">{formatDate(item.created_at)}</td>
          <td><label className="resolve-control"><input type="checkbox" checked={Boolean(item.checked)} disabled={Boolean(updating[item.id])} onChange={(e) => toggle(item, e.target.checked)} /><span>{item.checked ? 'Done' : 'Mark done'}</span></label></td>
        </tr>)}
      </tbody></table></div>
      <div className="table-foot"><span>Showing <strong>{visible.length}</strong> of <strong>{items.length}</strong> queries</span><span>Changes are saved to the existing backend.</span></div>
    </section>
  </div>
}

function Stat({ label, value, icon, detail, accent = '' }) {
  return <article className="stat-card panel"><div className={`stat-icon ${accent}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></article>
}
