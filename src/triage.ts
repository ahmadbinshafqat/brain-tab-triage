import type { Cluster, TabItem, TriageResult } from './types';

type Topic = {
  key: string;
  label: string;
  summaryNoun: string;
  action: string;
  keywords: string[];
};

const topics: Topic[] = [
  {
    key: 'dev',
    label: 'Code & technical references',
    summaryNoun: 'development references',
    action: 'Keep the highest-value reference open, then file the rest into a project note.',
    keywords: ['github', 'gitlab', 'stackoverflow', 'stack overflow', 'react', 'typescript', 'javascript', 'python', 'api', 'docs', 'documentation', 'mdn', 'npm', 'vite', 'pull request', 'issue', 'bug', 'code']
  },
  {
    key: 'work',
    label: 'Work planning & collaboration',
    summaryNoun: 'work coordination tabs',
    action: 'Decide the next concrete task and close anything not needed for that task.',
    keywords: ['linear', 'jira', 'asana', 'notion', 'slack', 'calendar', 'meeting', 'sprint', 'planning', 'roadmap', 'project', 'task', 'board', 'doc', 'docs']
  },
  {
    key: 'money',
    label: 'Admin, finance & receipts',
    summaryNoun: 'admin and finance items',
    action: 'Process or archive these together in one short admin pass.',
    keywords: ['gmail', 'mail', 'invoice', 'receipt', 'bank', 'budget', 'payment', 'tax', 'stripe', 'paypal', 'expense', 'pdf', 'contractor']
  },
  {
    key: 'design',
    label: 'Design & product ideas',
    summaryNoun: 'design and product references',
    action: 'Capture the useful insight in your design notes, then close the inspiration tabs.',
    keywords: ['figma', 'design', 'wireframe', 'prototype', 'ux', 'ui', 'color', 'palette', 'tokens', 'brand', 'accessibility', 'onboarding']
  },
  {
    key: 'learn',
    label: 'Reading & learning queue',
    summaryNoun: 'reading and learning tabs',
    action: 'Pick one to read now and save the rest to a read-later list.',
    keywords: ['article', 'blog', 'news', 'hacker news', 'youtube', 'course', 'tutorial', 'guide', 'learn', 'tips', 'research', 'paper', 'book']
  }
];

const genericAction = 'Scan for duplicates, keep the tab that represents the next action, and close the rest.';

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function normalizeUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (!url.hostname.includes('.')) return null;
    return url;
  } catch {
    return null;
  }
}

function parseLine(line: string, sessionId: string, index: number): TabItem | null {
  const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim();
  if (!cleaned) return null;

  const urlMatch = cleaned.match(/https?:\/\/[^\s)]+|(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s)]*)?/i);
  const url = urlMatch ? normalizeUrl(urlMatch[0]) : normalizeUrl(cleaned);
  const title = url && cleaned === urlMatch?.[0]
    ? url.hostname.replace(/^www\./, '') + url.pathname.replace(/[-/_]/g, ' ')
    : cleaned.replace(/https?:\/\/[^\s)]+|(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s)]*)?/ig, '').replace(/[|–—-]+$/g, '').trim() || cleaned;

  return {
    id: `tab_${index}_${id('item')}`,
    sessionId,
    title,
    url: url?.href,
    host: url?.hostname.replace(/^www\./, '')
  };
}

function scoreTopic(item: TabItem, topic: Topic): number {
  const haystack = `${item.title} ${item.url ?? ''} ${item.host ?? ''}`.toLowerCase();
  return topic.keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
}

function chooseClusterKey(item: TabItem): string {
  const scored = topics.map((topic) => ({ topic, score: scoreTopic(item, topic) })).sort((a, b) => b.score - a.score);
  if (scored[0]?.score > 0) return scored[0].topic.key;
  if (item.host) return `host:${item.host}`;
  return 'misc';
}

function titleCaseHost(host: string): string {
  return host.split('.').slice(0, -1).join(' ').replace(/\b\w/g, (m) => m.toUpperCase()) || host;
}

export function triageTabs(inputText: string): TriageResult {
  const session = { id: id('session'), createdAt: new Date().toISOString(), inputText };
  const lines = inputText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items = lines.map((line, index) => parseLine(line, session.id, index)).filter((item): item is TabItem => Boolean(item));
  const buckets = new Map<string, TabItem[]>();

  for (const item of items) {
    const key = chooseClusterKey(item);
    buckets.set(key, [...(buckets.get(key) ?? []), item]);
  }

  const clusters: Cluster[] = Array.from(buckets.entries()).map(([key, bucket], index) => {
    const clusterId = `cluster_${index}_${id('group')}`;
    const topic = topics.find((candidate) => candidate.key === key);
    const hosts = Array.from(new Set(bucket.map((item) => item.host).filter(Boolean))) as string[];
    const label = topic?.label ?? (key.startsWith('host:') ? `${titleCaseHost(key.slice(5))} tabs` : 'Loose ends to review');
    const summary = topic
      ? `${bucket.length} ${topic.summaryNoun}${hosts.length ? ` across ${hosts.slice(0, 3).join(', ')}` : ''}.`
      : `${bucket.length} related item${bucket.length === 1 ? '' : 's'}${hosts.length ? ` from ${hosts.slice(0, 3).join(', ')}` : ''}.`;
    const score = Math.min(100, 45 + bucket.length * 12 + (hosts.length > 1 ? 8 : 0));

    for (const item of bucket) item.clusterId = clusterId;

    return {
      id: clusterId,
      sessionId: session.id,
      label,
      summary,
      score,
      action: topic?.action ?? genericAction,
      itemIds: bucket.map((item) => item.id)
    };
  }).sort((a, b) => b.itemIds.length - a.itemIds.length || b.score - a.score);

  return { session, items, clusters };
}
