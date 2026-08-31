import { makeItem } from './scoring';
import type { Item } from './types';

export function seedItems(): Item[] {
  return [
    makeItem('React documentation: Thinking in React', 'https://react.dev/learn/thinking-in-react'),
    makeItem('SQLite performance checklist 2025', 'https://sqlite.org/docs.html'),
    makeItem('Viral gadget unboxing sale', 'https://youtube.com/watch?v=demo'),
    makeItem('Deep dive: accessible design systems', 'https://example.com/accessibility-design-systems')
  ];
}
