import { useEffect, useRef, useState } from 'react'
import { sendChat } from './api.js'

const suggestions = [
  { title: 'Reset my password', prompt: 'How do I reset my password?', icon: '↻' },
  { title: 'Payment methods', prompt: 'What payment methods do you accept?', icon: '◇' },
  { title: 'Talk to a person', prompt: 'I want to talk to a human agent', icon: '◎' },
]

function createSessionId() {
  const existing = localStorage.getItem('session_id')
  if (existing) return existing
  const id = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
  localStorage.setItem('session_id', id)
  return id
}

export default function ChatPage() {
  const [sessionId] = useState(createSessionId)
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Welcome to Helix Support. I can help with common questions about accounts, billing, shipping, and plans. What can I help you with?' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
  endRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'end',
  })
}, [messages, busy])

  async function submit(text = input) {
    const question = text.trim()
    if (!question || busy) return
    setInput(''); setError('')
    setMessages((items) => [...items, { role: 'user', text: question }])
    setBusy(true)
    try {
      const result = await sendChat(sessionId, question)
      setMessages((items) => [...items, { role: 'assistant', text: result.answer, meta: result }])
    } catch (err) {
      setError(`${err.message}. Confirm the FastAPI server is running and the AI provider is configured.`)
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  function newChat() {
    const id = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`
    localStorage.setItem('session_id', id)
    window.location.reload()
  }

  return <div className="page-wrap">
    <header className="page-header">
      <div><div className="eyebrow">CUSTOMER EXPERIENCE <span className="eyebrow-line" /></div><h1>Support, made simple.</h1><p>Get clear answers from the knowledge base, with a human handoff when needed.</p></div>
      <button className="button ghost" onClick={newChat} title="Start a fresh conversation">＋ New chat</button>
    </header>
    <section className="chat-layout">
      <div className="chat-panel panel">
        <div className="chat-panel-head"><div className="assistant-avatar">✦</div><div className="assistant-info"><strong>Helix AI Assistant</strong><span><i className="online-dot" /> Knowledge-base assistant</span></div><span className="secure-label">RAG ENABLED</span></div>
        <div className="message-list" aria-live="polite">
          <div className="conversation-date">YOUR CONVERSATION</div>
          {messages.map((message, index) => <div className={`message-row ${message.role === 'user' ? 'from-user' : 'from-assistant'}`} key={`${index}-${message.role}`}>
            {message.role !== 'user' && <div className="message-avatar">✦</div>}
            <div className="message-content"><div className={`message-bubble ${message.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>{message.text}</div>
              {message.meta?.escalated && <div className="escalation-note">↗ Flagged for human review{message.meta.reason ? ` · ${message.meta.reason}` : ''}</div>}
              {message.meta?.matches?.length > 0 && <details className="sources"><summary>View FAQ matches ({message.meta.matches.length})</summary><div className="source-list">{message.meta.matches.map((match, i) => <div className="source-item" key={`${match.question}-${i}`}><strong>{match.question}</strong><span>{match.category || 'General'} · distance {match.distance}</span></div>)}</div></details>}
            </div>
          </div>)}
          {busy && <div className="message-row from-assistant"><div className="message-avatar">✦</div><div className="message-bubble assistant-bubble typing"><span /><span /><span /> Thinking through your question…</div></div>}
          <div ref={endRef} />
        </div>
        {messages.length === 1 && <div className="suggestion-area"><span className="suggestion-label">QUICK START</span><div className="suggestion-grid">{suggestions.map((item) => <button className="suggestion-card" key={item.title} onClick={() => submit(item.prompt)} disabled={busy}><span className="suggestion-icon">{item.icon}</span><span>{item.title}</span><span className="suggestion-arrow">↗</span></button>)}</div></div>}
        {error && <div className="notice error">{error}</div>}
        <form className="composer" onSubmit={(event) => { event.preventDefault(); submit() }}><input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question about your account, billing, or plan…" aria-label="Your question" disabled={busy} /><button className="send-button" type="submit" disabled={busy || !input.trim()}>Send <span>↗</span></button></form>
        <div className="composer-hint">AI-generated responses may need review for complex issues.</div>
      </div>
      <aside className="chat-aside">
        <div className="side-card panel"><div className="side-card-icon">✧</div><h3>Answers from your FAQs</h3><p>The assistant searches your knowledge base before responding, helping keep answers relevant to your support content.</p><div className="side-divider"/><div className="side-feature"><span className="feature-check">✓</span><span><strong>Context-aware</strong><small>Uses recent conversation history</small></span></div><div className="side-feature"><span className="feature-check">✓</span><span><strong>Human handoff</strong><small>Flags uncertain questions for review</small></span></div></div>
        <div className="privacy-card"><span className="privacy-icon">◈</span><div><strong>Need a person?</strong><p>Ask to speak with a human agent and the query will be flagged in the dashboard.</p></div></div>
      </aside>
    </section>
  </div>
}
