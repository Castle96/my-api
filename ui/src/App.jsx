

import React, { useEffect, useState } from 'react';

const API_URL = '/'; // Proxy to MCP server
const API_KEY = 'supersecretkey123'; // Change as needed

function App() {
  const [resources, setResources] = useState([]);
  const [selected, setSelected] = useState('');
  const [input, setInput] = useState('{}');
  const [response, setResponse] = useState('');
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState({});

  useEffect(() => {
    fetch(API_URL, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    })
      .then(res => res.json())
      .then(data => setResources(data.resources || []));

    setLoadingModels(true);
    fetch('/ollama/api/tags')
      .then(res => res.json())
      .then(data => {
        setModels(data.models || []);
        setLoadingModels(false);
      })
      .catch(() => {
        setError('Failed to fetch models');
        setLoadingModels(false);
      });
  }, []);

  const handleTest = async () => {
    if (!selected) return;
    let body = {};
    try { body = JSON.parse(input); } catch {}
    const res = await fetch(`/resource/${selected}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
  };

  // Model management actions
  const pullModel = async (name) => {
    setActionStatus(s => ({ ...s, [name]: 'pulling' }));
    try {
      const res = await fetch('/ollama/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        setActionStatus(s => ({ ...s, [name]: 'pulled' }));
      } else {
        setActionStatus(s => ({ ...s, [name]: 'error' }));
      }
    } catch {
      setActionStatus(s => ({ ...s, [name]: 'error' }));
    }
  };

  const deleteModel = async (name) => {
    setActionStatus(s => ({ ...s, [name]: 'deleting' }));
    try {
      const res = await fetch('/ollama/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        setActionStatus(s => ({ ...s, [name]: 'deleted' }));
      } else {
        setActionStatus(s => ({ ...s, [name]: 'error' }));
      }
    } catch {
      setActionStatus(s => ({ ...s, [name]: 'error' }));
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f9f9fb', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: '2rem' }}>
      <h1 style={{ color: '#2a2a2a', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>MCP UI Dashboard</h1>
      <h2 style={{ color: '#444', marginTop: '2rem' }}>Available Resources</h2>
      <ul>
        {resources.map(r => (
          <li key={r.name} style={{ marginBottom: 8 }}>
            <button onClick={() => setSelected(r.name)} style={{ background: '#0078d4', color: '#fff', border: 'none', borderRadius: 4, padding: '0.3rem 1rem', cursor: 'pointer', marginRight: 8 }}>{r.name}</button>
            <span style={{ color: '#555' }}>{r.description}</span>
          </li>
        ))}
      </ul>
      <h2 style={{ color: '#444', marginTop: '2rem' }}>Ollama Models</h2>
      {loadingModels ? <div>Loading models...</div> : null}
      {error ? <div style={{ color: 'red' }}>{error}</div> : null}
      <ul>
        {models.map(m => (
          <li key={m.name} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{m.name}</span>
            <span style={{ marginLeft: 8, color: '#888' }}>({m.size})</span>
            <span style={{ marginLeft: 8, color: '#888' }}>{actionStatus[m.name] === 'pulling' ? 'Pulling...' : actionStatus[m.name] === 'pulled' ? 'Pulled' : actionStatus[m.name] === 'deleting' ? 'Deleting...' : actionStatus[m.name] === 'deleted' ? 'Deleted' : ''}</span>
            <button onClick={() => pullModel(m.name)} style={{ marginLeft: 16, background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, padding: '0.2rem 0.7rem', cursor: 'pointer' }}>Pull</button>
            <button onClick={() => deleteModel(m.name)} style={{ marginLeft: 8, background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '0.2rem 0.7rem', cursor: 'pointer' }}>Delete</button>
          </li>
        ))}
      </ul>
      {selected && (
        <div style={{ marginTop: '2rem', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: '1rem' }}>
          <h3 style={{ color: '#0078d4' }}>Test Resource: {selected}</h3>
          <textarea
            rows={4}
            style={{ width: '100%', borderRadius: 4, border: '1px solid #ddd', padding: '0.5rem' }}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="JSON input (if required)"
          />
          <br />
          <button onClick={handleTest} style={{ marginTop: '1rem', background: '#0078d4', color: '#fff', border: 'none', borderRadius: 4, padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Send Request</button>
          <pre style={{ background: '#eee', padding: '1rem', marginTop: '1rem', borderRadius: 4 }}>{response}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
