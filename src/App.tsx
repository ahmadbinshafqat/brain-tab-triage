import { useEffect, useMemo, useState } from 'react';
import { Archive, ClipboardPaste, RotateCcw, Trash2 } from 'lucide-react';
import { parseInput } from './parser';
import { loadItems, saveItems } from './storage';
import { seedItems } from './seed';
import type { Bucket, Item } from './types';

const buckets: Array<{ id: Bucket; label: string; hint: string }> = [
  { id: 'keep', label: 'Keep', hint: 'High relevance, act soon' },
  { id: 'later', label: 'Later', hint: 'Useful, not urgent' },
  { id: 'toss', label: 'Toss', hint: 'Low signal or distraction' }
];

export function App() {
  const [items, setItems] = useState<Item[]>(() => loadItems());
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => saveItems(items), [items]);

  const sortedItems = useMemo(() => [...items].sort((a, b) => b.score - a.score), [items]);
  const counts = buckets.map((b) => ({ ...b, count: items.filter((i) => i.bucket === b.id).length }));

  function importItems() {
    const parsed = parseInput(input);
    if (!parsed.length) {
      setMessage('Paste at least one title or URL.');
      return;
    }
    const existingKeys = new Set(items.map((i) => i.url || i.title.toLowerCase()));
    const fresh = parsed.filter((i) => !existingKeys.has(i.url || i.title.toLowerCase()));
    setItems((current) => [...fresh, ...current]);
    setInput('');
    setMessage(`Imported ${fresh.length} item${fresh.length === 1 ? '' : 's'} and auto-bucketed by score.`);
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleDrop(event: React.DragEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setInput(await file.text());
      setMessage(`Loaded ${file.name}. Click Triage list to import.`);
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Personal productivity · local first</p>
          <h1>Tab Triage</h1>
          <p>Paste a messy reading pile, get a relevance score, then sweep each link into keep, later, or toss.</p>
        </div>
        <button className="secondary" onClick={() => setItems(seedItems())}><RotateCcw size={16} /> Load demo</button>
      </header>

      <section className="importer">
        <div className="importerHeader">
          <h2><ClipboardPaste size={20} /> Paste or drop links</h2>
          <button onClick={importItems}>Triage list</button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          placeholder={'https://react.dev/learn React docs\nSQLite tips - https://sqlite.org/docs.html\nInteresting article title without URL'}
        />
        {message && <p className="message">{message}</p>}
      </section>

      <section className="stats">
        {counts.map((b) => <div key={b.id}><strong>{b.count}</strong><span>{b.label}</span></div>)}
        <div><strong>{items.length ? Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length) : 0}</strong><span>Avg score</span></div>
      </section>

      <section className="board">
        {buckets.map((bucket) => (
          <div className="column" key={bucket.id}>
            <div className="columnTitle"><h2>{bucket.label}</h2><span>{bucket.hint}</span></div>
            {sortedItems.filter((item) => item.bucket === bucket.id).map((item) => (
              <article className="card" key={item.id}>
                <div className="cardTop">
                  <span className={`score ${scoreClass(item.score)}`}>{item.score}</span>
                  <button className="icon" aria-label="Delete item" onClick={() => removeItem(item.id)}><Trash2 size={15} /></button>
                </div>
                <h3>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : item.title}</h3>
                {item.domain && <p className="domain">{item.domain}</p>}
                <label>
                  Bucket
                  <select value={item.bucket} onChange={(e) => updateItem(item.id, { bucket: e.target.value as Bucket })}>
                    {buckets.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </label>
                <label>
                  Notes
                  <input value={item.notes} onChange={(e) => updateItem(item.id, { notes: e.target.value })} placeholder="Why keep or toss?" />
                </label>
              </article>
            ))}
            {!items.some((i) => i.bucket === bucket.id) && <p className="empty"><Archive size={16} /> Nothing here yet.</p>}
          </div>
        ))}
      </section>
    </main>
  );
}

function scoreClass(score: number) {
  if (score >= 68) return 'high';
  if (score >= 38) return 'mid';
  return 'low';
}
