import { useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { getSettings } from './api.js'
import ChatPage from './ChatPage.jsx'
import DashboardPage from './DashboardPage.jsx'

function initials(name) {
  return (name || 'Helix Support').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function Shell({ children }) {
  const [company, setCompany] = useState('Helix Support')
  const [settingsError, setSettingsError] = useState(false)
  useEffect(() => {
    getSettings().then((data) => setCompany(data.company_name || 'Helix Support')).catch(() => setSettingsError(true))
  }, [])
  const mark = useMemo(() => initials(company), [company])
  useEffect(() => { document.title = `${company} | AI Helpdesk` }, [company])

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label={`${company} home`}>
        <span className="brand-mark">{mark}</span>
        <span><strong>{company}</strong><small>AI support workspace</small></span>
      </a>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">◈</span> Support chat</NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">▦</span> Query dashboard</NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="status-dot" /> <span>AI helpdesk</span><span className="status-pill">Ready</span>
        <p>Answers are grounded in your FAQ knowledge base. Uncertain queries can be reviewed by your team.</p>
      </div>
    </aside>
    <main className="main-content">
      {settingsError && <div className="notice warning">Could not load app settings. Check that the FastAPI backend is running on port 8000.</div>}
      {children}
      <footer className="app-footer"><span>Built with React + FastAPI</span><span>AI-powered support workspace</span></footer>
    </main>
  </div>
}

export default function App() {
  return <Shell><Routes>
    <Route path="/" element={<ChatPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="*" element={<div className="empty-state"><h2>Page not found</h2><p>Use the navigation to return to the support workspace.</p><NavLink className="button primary" to="/">Back to chat</NavLink></div>} />
  </Routes></Shell>
}
