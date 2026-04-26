# Books/Taxonomy Operational Gates

Updated: 2026-04-25

This file tracks operational gates that cannot be proven by unit tests alone.
Record the evidence link, executor, date, and blockers before cutover.

## CI / WAF Gates

| Gate | Status | Evidence | Executor | Date | Blockers |
| --- | --- | --- | --- | --- | --- |
| `e2e-reader.yml` production run green | Complete | https://github.com/kosmynapp/kosmyn-books/actions/runs/24926705451 | Codex via GitHub Actions | 2026-04-25 | None |
| `e2e-seo.yml` production run green | Complete | https://github.com/kosmynapp/kosmyn-books/actions/runs/24926705448 | Codex via GitHub Actions | 2026-04-25 | None |
| Cloudflare bypass verified | Complete | Both green runs passed `Bypass Cloudflare via /etc/hosts override` | Codex via GitHub Actions | 2026-04-25 | GitHub emitted Node.js 20 action deprecation warnings; no WAF blocker remained |

Runbook:

```bash
gh workflow run e2e-reader.yml -f environment=production
gh workflow run e2e-seo.yml -f environment=production
gh run list --workflow=e2e-reader.yml --limit=5
gh run list --workflow=e2e-seo.yml --limit=5
```

## Human UAT Gates

| Gate | Status | Evidence | Executor | Date | Blockers |
| --- | --- | --- | --- | --- | --- |
| Phase 31 UAT-01 mobile Safari memory stress | Pending human execution | TBD: device notes/screenshot/runbook link | TBD | TBD | Requires physical iOS/Safari device |
| Phase 38 five physical-device smokes | Pending human execution | TBD: five smoke notes with device/build | TBD | TBD | Requires physical device and production/staging build |
| Phase 36 taxonomy review reaches `source='manual' >= 95%` | Pending admin review | TBD: admin/export evidence | TBD | TBD | Requires admin access to classification review |
| `classificationPublicFiltersEnabled` enabled in staging | Pending rollout | TBD: feature flag audit/screenshot | TBD | TBD | Requires staging flag access |
| `classificationPublicFiltersEnabled` enabled in production | Pending rollout | TBD: feature flag audit/screenshot | TBD | TBD | Requires production flag access after staging validation |

## Acceptance

- Do not mark a gate complete without a concrete evidence URL or attached note.
- If a gate cannot be executed by the current owner, keep status as `Blocked` and fill the blocker column.
- Functional code PRs should not claim these gates as complete unless this file is updated with evidence.
