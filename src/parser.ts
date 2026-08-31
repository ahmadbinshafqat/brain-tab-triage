import { makeItem } from './scoring';
import type { Item } from './types';

const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/i;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().replace(/[),.;]+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return '';
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^[-*\d.)\s]+/, '')
    .replace(/[|—–-]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseInput(input: string): Item[] {
  const seen = new Set<string>();
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(urlRegex);
      const url = match ? normalizeUrl(match[0]) : '';
      const titlePart = match ? line.replace(match[0], ' ') : line;
      const title = cleanTitle(titlePart);
      return makeItem(title, url);
    })
    .filter((item) => {
      const key = item.url || item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
