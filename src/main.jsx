import React from 'react'
import ReactDOM from 'react-dom/client'
import Omote, { PerformanceShell } from './App.jsx'

// Detect performance new-tab before mounting — avoids hooks ordering issue
let perfSession = null;
const hash = window.location.hash;
const match = hash.match(/^#\/s\/([a-zA-Z0-9]+)$/);
if (match) {
  try {
    const data = JSON.parse(localStorage.getItem("omote-perf-" + match[1]));
    if (data) perfSession = data;
  } catch {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {perfSession ? <PerformanceShell session={perfSession}/> : <Omote />}
  </React.StrictMode>,
)
