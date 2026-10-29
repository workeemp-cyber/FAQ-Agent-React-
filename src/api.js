async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`)
  return data
}

export const getSettings = () => request('/api/settings')
export const sendChat = (session_id, message) => request('/api/chat', {
  method: 'POST', body: JSON.stringify({ session_id, message }),
})
export const getQueries = () => request('/api/queries')
export const setQueryChecked = (id, checked) => request(`/api/queries/${encodeURIComponent(id)}`, {
  method: 'PATCH', body: JSON.stringify({ checked }),
})
