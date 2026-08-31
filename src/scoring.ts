import type { Bucket, Item } from './types';

const positiveTerms = [
  'guide', 'docs', 'documentation', 'reference', 'tutorial', 'learn', 'course', 'research',
  'case study', 'productivity', 'writing', 'design', 'engineering', 'react', 'typescript',
  'javascript', 'css', 'sqlite', 'database', 'api', 'architecture', 'security', 'performance',
  'accessibility', 'career', 'strategy', 'analysis', 'deep dive', 'checklist'
];

const noisyTerms = [
  'sale', 'coupon', 'deal', 'promo', 'celebrity', 'gossip', 'meme', 'shorts', 'trending',
  'viral', 'unboxing', 'reaction', 'sponsored'
];

const strongDomains = ['github.com', 'docs.', 'developer.', 'wikipedia.org', 'medium.com', 'substack.com', 'arxiv.org', 'news.ycombinator.com'];
const noisyDomains = ['facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'youtube.com', 'amazon.com'];

export function defaultBucket(score: number): Bucket {
  if (score >= 68) return 'keep';
  if (score >= 38) return 'later';
  return 'toss';
}

export function scoreItem(title: string, url: string, domain: string): number {
  const text = `${title} ${url} ${domain}`.toLowerCase();
  let score = 45;

  for (const term of positiveTerms) {
    if (text.includes(term)) score += term.length > 8 ? 7 : 5;
  }

  for (const term of noisyTerms) {
    if (text.includes(term)) score -= 8;
  }

  if (title.length >= 12 && title.length <= 90) score += 8;
  if (title.length > 120) score -= 6;
  if (url.startsWith('https://')) score += 4;
  if (!url) score -= 4;
  if (strongDomains.some((d) => domain.includes(d) || url.includes(d))) score += 10;
  if (noisyDomains.some((d) => domain.includes(d))) score -= 12;
  if (/\b(2024|2025|2026)\b/.test(text)) score += 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function makeItem(title: string, url: string): Item {
  const domain = extractDomain(url);
  const fallbackTitle = title.trim() || domain || url || 'Untitled note';
  const score = scoreItem(fallbackTitle, url, domain);

  return {
    id: crypto.randomUUID(),
    title: fallbackTitle,
    url,
    domain,
    score,
    bucket: defaultBucket(score),
    notes: '',
    createdAt: new Date().toISOString()
  };
}

export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
