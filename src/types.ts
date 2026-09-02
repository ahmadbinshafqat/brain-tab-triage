export type Session = {
  id: string;
  createdAt: string;
  inputText: string;
};

export type TabItem = {
  id: string;
  sessionId: string;
  title: string;
  url?: string;
  host?: string;
  clusterId?: string;
};

export type Cluster = {
  id: string;
  sessionId: string;
  label: string;
  summary: string;
  score: number;
  action: string;
  itemIds: string[];
};

export type TriageResult = {
  session: Session;
  items: TabItem[];
  clusters: Cluster[];
};

export type StoredSession = TriageResult;
