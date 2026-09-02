import type { StoredSession } from './types';

const KEY = 'tab-triage.sessions.v1';
const MAX_SESSIONS = 5;

export function loadSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(session: StoredSession): void {
  const existing = loadSessions().filter((item) => item.session.id !== session.session.id);
  const next = [session, ...existing].slice(0, MAX_SESSIONS);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearSessions(): void {
  localStorage.removeItem(KEY);
}
