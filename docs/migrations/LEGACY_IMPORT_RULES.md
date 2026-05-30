# Legacy Import Rules
1. Import source repos into `legacy/` first.
2. Do not merge source logic directly into root.
3. Do not import `.env` files, private keys, service account files, or secrets.
4. Do not delete source files.
5. Extract one app/package at a time.
6. After every extraction:
   - run validation
   - update `PROJECT_STATE.md`
   - update `NEXT_ACTIONS.md`
   - update `DECISIONS_LOG.md`
   - write risk note
