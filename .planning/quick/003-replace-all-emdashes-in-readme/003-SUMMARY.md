---
phase: quick-003
plan: 003
status: complete
---

## Summary

Replaced all Unicode emdashes (`—`) in `README.md` with ASCII `-`.

### Changes

- Updated banner alt text + tagline to use ASCII hyphen punctuation
- Updated CI/CD workflow bullets to use ASCII hyphen punctuation

### Verification

- `rg "—" README.md` returns zero matches

### Files Modified

- `README.md`
