import { useMemo, useState } from 'react';
import { BrainCircuit, ClipboardPaste, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { seedInput } from './seed';
import { clearSessions, loadSessions, saveSession } from './storage';
import { triageTabs } from './triage';
import type { Cluster, StoredSession, TabItem, TriageResult } from './types';

function ClusterCard({ cluster, items }: { cluster: Cluster; items: TabItem[] }) {
  return (
    <article className="cluster-card">
      <div className="cluster-topline">
        <h3>{cluster.label}</h3>
        <span className="score">{cluster.score}% confidence</span>
      </div>
      <p className="summary">{cluster.summary}</p>
      <div className="action"><Sparkles size={16} /> {cluster.action}</div>
      <ul className="tab-list">
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.title}</span>
            {item.host && <small>{item.host}</small>}
          </li>
        ))}
      </ul>
    </article>
  );
}

function App() {
  const [input, setInput] = useState(seedInput);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [history, setHistory] = useState<StoredSession[]>(() => loadSessions());
  const appEnv = import.meta.env.VITE_APP_ENV ?? 'local';

  const itemCount = useMemo(() => input.split(/\r?\n/).filter((line) => line.trim()).length, [input]);

  function runTriage() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const next = triageTabs(trimmed);
    setResult(next);
    saveSession(next);
    setHistory(loadSessions());
  }

  function resetToSeed() {
    setInput(seedInput);
    setResult(null);
  }

  function clearHistory() {
    clearSessions();
    setHistory([]);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="logo"><BrainCircuit size={28} /></div>
        <div>
          <p className="eyebrow">Personal productivity · browser-only MVP</p>
          <h1>Tab Triage</h1>
          <p className="lede">Paste tab chaos. Get a short, actionable overview grouped into useful buckets.</p>
        </div>
      </section>

      <section className="workspace">
        <div className="input-panel panel">
          <div className="panel-heading">
            <div>
              <h2>Paste your tabs</h2>
              <p>One title or URL per line. Mixed titles and links are fine.</p>
            </div>
            <span className="pill">{itemCount} lines</span>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            aria-label="Pasted tab list"
          />
          <div className="button-row">
            <button className="primary" onClick={runTriage}><ClipboardPaste size={17} /> Triage tabs</button>
            <button onClick={resetToSeed}><RotateCcw size={17} /> Seed example</button>
          </div>
        </div>

        <div className="output-panel panel">
          <div className="panel-heading">
            <div>
              <h2>Actionable clusters</h2>
              <p>{result ? `${result.clusters.length} groups from ${result.items.length} parsed tabs` : 'Results appear here after triage.'}</p>
            </div>
          </div>

          {!result && (
            <div className="empty-state">
              <Sparkles size={34} />
              <h3>Ready when your browser is not.</h3>
              <p>Click “Triage tabs” to generate labels, summaries, and next-action suggestions.</p>
            </div>
          )}

          {result && result.clusters.length === 0 && <p>No usable lines found. Try pasting one title or URL per line.</p>}

          {result?.clusters.map((cluster) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              items={result.items.filter((item) => cluster.itemIds.includes(item.id))}
            />
          ))}
        </div>
      </section>

      <section className="history panel">
        <div className="panel-heading">
          <div>
            <h2>Recent sessions</h2>
            <p>Stored locally in this browser.</p>
          </div>
          {history.length > 0 && <button onClick={clearHistory}><Trash2 size={16} /> Clear</button>}
        </div>
        {history.length === 0 ? <p className="muted">No saved sessions yet.</p> : (
          <div className="history-list">
            {history.map((entry) => (
              <button key={entry.session.id} onClick={() => { setInput(entry.session.inputText); setResult(entry); }}>
                <strong>{new Date(entry.session.createdAt).toLocaleString()}</strong>
                <span>{entry.clusters.length} clusters · {entry.items.length} tabs</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <footer>Running in <code>{appEnv}</code> · No tab data leaves your browser.</footer>
    </main>
  );
}

export default App;
