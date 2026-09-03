export type Bucket = 'keep' | 'later' | 'toss';

export interface TriagedItem {
  id: string;
  title: string;
  url?: string;
  score: number;
  bucket: Bucket;
  notes: string;
  createdAt: string;
}

export interface ExportPayload {
  exportedAt: string;
  app: 'tab-triage';
  version: 1;
  counts: Record<Bucket, number>;
  items: TriagedItem[];
}

export const BUCKETS: Bucket[] = ['keep', 'later', 'toss'];

export const BUCKET_LABELS: Record<Bucket, string> = {
  keep: 'Keep',
  later: 'Later',
  toss: 'Toss',
};
