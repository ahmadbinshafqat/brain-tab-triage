import { useEffect, useMemo, useState } from 'react';
import { BUCKET_LABELS, BUCKETS, type Bucket, type TriagedItem } from './types';
import { buildExportPayload, clearItems, countByBucket, loadItems, saveItems } from './storage';

const SAMPLE_INPUT = `https://react.dev/learn React documentation
SQLite tips - https://sqlite.org/docs.html
A title without URL
https://example.com/article`;

const SCORE_TERMS = [
  'docs',
  'documentation',
  'guide',
  'learn',
  'tutorial',
  'reference',
  'engineering',
  'productivity',
  'sqlite',
  'react',
  'typescript',
  'api',
  'design',
  'architecture',
];

const NOISY_TERMS = ['shopping', 'coupon', 'sale', 'shorts', 'viral', 'celebrity'];

function App() {
  const [items, setItems] = useState<TriagedItem[]>(() => loadItems());
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [status, setStatus] = useState('');

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const counts = useMemo(() => countByBucket(items), [items]);

  function importItems() {
    const imported = parseInput(input);
    if (imported.length === 0) {
      setStatus('Paste at least one non-empty line to import.');
      return;
    }

    setItems((current) => [...imported, ...current]);
    setStatus(`Imported ${imported.length} item${imported.length === 1 ? '' : 's'}.`);
  }

  function updateBucket(id: string, bucket: Bucket) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, bucket } : item)));
  }

  function updateNotes(id: string, notes: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, notes } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function resetBoard() {
    setItems([]);
    clearItems();
    setStatus('Board cleared.');
  }

  function exportJson() {
    if (items.length === 0) {
      setStatus('Nothing to export yet.');
      return;
    }

    const payload = buildExportPayload(items);
    downloadFile(
      `tab-triage-${dateStamp()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8',
    );
    setStatus('Downloaded JSON export.');
  }

  function exportCsv() {
    if (items.length === 0) {
      setStatus('Nothing to export yet.');
      return;
    }

    downloadFile(`tab-triage-${dateStamp()}.csv`, toCsv(items), 'text/csv;charset=utf-8');
    setStatus('Downloaded CSV export.');
  }

  async function copySummary() {
    if (items.length === 0) {
      setStatus('Nothing to share yet.');
      return;
    }

    const summary = buildShareSummary(items);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
      } else {
        copyWithFallback(summary);
      }
      setStatus('Copied shareable summary to clipboard.');
    } catch (error) {
      console.warn('Clipboard copy failed:', error);
      setStatus('Clipboard copy failed. Your browser may require HTTPS or clipboard permission.');
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Tab Triage</p>
          <h1>Sort messy links into Keep, Later, and Toss.</h1>
          <p className="lede">
            Paste URLs or titles, review the local relevance score, then export the finished board as CSV,
            JSON, or a shareable clipboard summary.
          </p>
        </div>
        <div className="stats" aria-label="Board counts">
          {BUCKETS.map((bucket) => (
            <div className="stat" key={bucket}>
              <strong>{counts[bucket]}</strong>
              <span>{BUCKET_LABELS[bucket]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel import-panel" aria-labelledby="import-heading">
        <div className="panel-heading">
          <div>
            <h2 id="import-heading">Import links</h2>
            <p>One link or title per line. URLs can appear anywhere in the line.</p>
          </div>
          <button type="button" className="secondary" onClick={() => setInput(SAMPLE_INPUT)}>
            Load sample
          </button>
        </div>
        <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={6} />
        <div className="actions">
          <button type="button" onClick={importItems}>
            Import to board
          </button>
          <button type="button" className="danger subtle" onClick={resetBoard} disabled={items.length === 0}>
            Clear board
          </button>
        </div>
      </section>

      <section className="panel export-panel" aria-labelledby="export-heading">
        <div>
          <h2 id="export-heading">Export & share</h2>
          <p>Use your triaged results outside the app for follow-up, archiving, or sending to someone else.</p>
        </div>
        <div className="export-actions">
          <button type="button" onClick={exportCsv} disabled={items.length === 0}>
            Export CSV
          </button>
          <button type="button" onClick={exportJson} disabled={items.length === 0}>
            Export JSON
          </button>
          <button type="button" className="secondary" onClick={copySummary} disabled={items.length === 0}>
            Copy summary
          </button>
        </div>
      </section>

      {status && <p className="status" role="status">{status}</p>}

      <section className="board" aria-label="Triaged board">
        {BUCKETS.map((bucket) => (
          <BucketColumn
            key={bucket}
            bucket={bucket}
            items={items.filter((item) => item.bucket === bucket)}
            onBucketChange={updateBucket}
            onNotesChange={updateNotes}
            onRemove={removeItem}
          />
        ))}
      </section>
    </main>
  );
}

interface BucketColumnProps {
  bucket: Bucket;
  items: TriagedItem[];
  onBucketChange: (id: string, bucket: Bucket) => void;
  onNotesChange: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}

function BucketColumn({ bucket, items, onBucketChange, onNotesChange, onRemove }: BucketColumnProps) {
  return (
    <section className={`bucket bucket-${bucket}`}>
      <header>
        <h2>{BUCKET_LABELS[bucket]}</h2>
        <span>{items.length}</span>
      </header>
      <div className="cards">
        {items.length === 0 ? (
          <p className="empty">No items yet.</p>
        ) : (
          items.map((item) => (
            <article className="card" key={item.id}>
              <div className="card-topline">
                <span className="score">Score {item.score}</span>
                <button type="button" className="icon-button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.title}`}>
                  ×
                </button>
              </div>
              <h3>{item.title}</h3>
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.url}
                </a>
              )}
              <label>
                Bucket
                <select value={item.bucket} onChange={(event) => onBucketChange(item.id, event.target.value as Bucket)}>
                  {BUCKETS.map((option) => (
                    <option value={option} key={option}>
                      {BUCKET_LABELS[option]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Notes
                <textarea
                  value={item.notes}
                  rows={3}
                  placeholder="Add follow-up context…"
                  onChange={(event) => onNotesChange(item.id, event.target.value)}
                />
              </label>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function parseInput(raw: string): TriagedItem[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const url = extractUrl(line);
      const title = cleanTitle(line, url);
      const score = scoreItem(title, url);
      return {
        id: createId(),
        title,
        url,
        score,
        bucket: bucketForScore(score),
        notes: '',
        createdAt: new Date().toISOString(),
      };
    });
}

function extractUrl(line: string): string | undefined {
  const match = line.match(/https?:\/\/[^\s]+/i);
  return match?.[0].replace(/[),.;]+$/, '');
}

function cleanTitle(line: string, url?: string): string {
  const withoutUrl = url ? line.replace(url, '') : line;
  const cleaned = withoutUrl.replace(/^[-–—:|\s]+|[-–—:|\s]+$/g, '').trim();
  if (cleaned) return cleaned;
  if (!url) return line;

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function scoreItem(title: string, url?: string): number {
  const haystack = `${title} ${url ?? ''}`.toLowerCase();
  let score = 45;

  for (const term of SCORE_TERMS) {
    if (haystack.includes(term)) score += 6;
  }

  for (const term of NOISY_TERMS) {
    if (haystack.includes(term)) score -= 10;
  }

  if (url) score += 8;
  if (title.length >= 18) score += 5;
  if (/\.edu|\.gov|github\.com|developer\.|docs\.|sqlite\.org|react\.dev/i.test(url ?? '')) score += 10;
  if (/youtube\.com|tiktok\.com|instagram\.com|facebook\.com/i.test(url ?? '')) score -= 12;

  return Math.max(0, Math.min(100, score));
}

function bucketForScore(score: number): Bucket {
  if (score >= 70) return 'keep';
  if (score >= 45) return 'later';
  return 'toss';
}

function toCsv(items: TriagedItem[]): string {
  const rows = [
    ['bucket', 'score', 'title', 'url', 'notes', 'createdAt'],
    ...items.map((item) => [item.bucket, String(item.score), item.title, item.url ?? '', item.notes, item.createdAt]),
  ];

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildShareSummary(items: TriagedItem[]): string {
  const counts = countByBucket(items);
  const lines = [
    `Tab Triage Summary (${items.length} items)`,
    `Keep: ${counts.keep} · Later: ${counts.later} · Toss: ${counts.toss}`,
    '',
  ];

  for (const bucket of BUCKETS) {
    lines.push(`${BUCKET_LABELS[bucket]}:`);
    const bucketItems = items.filter((item) => item.bucket === bucket);
    if (bucketItems.length === 0) {
      lines.push('  - None');
    } else {
      for (const item of bucketItems) {
        const target = item.url ? ` — ${item.url}` : '';
        const notes = item.notes ? ` [Notes: ${item.notes}]` : '';
        lines.push(`  - ${item.title}${target}${notes}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function copyWithFallback(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('document.execCommand returned false');
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function createId(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default App;
