# Changes: Export and share triaged results

Added export/share actions to the Tab Triage board.

## What changed

- Added CSV export for the current Keep/Later/Toss board.
- Added JSON export with metadata and all triaged items.
- Added “Copy summary” action that writes a shareable plain-text summary to the clipboard.
- Added export helper types and localStorage utilities.
- Updated the app UI with an export/share toolbar and status messages.
- Added responsive styling for the new actions.

## Integration notes

These files are intended to be committed directly into the existing React/Vite repo. No new dependencies or environment variables are required.

Run as before:

```bash
npm install
npm run dev
```

Smoke test:

```bash
npm run smoke
```
