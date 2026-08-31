export type Bucket = 'keep' | 'later' | 'toss';

export interface Item {
  id: string;
  title: string;
  url: string;
  domain: string;
  score: number;
  bucket: Bucket;
  notes: string;
  createdAt: string;
}
