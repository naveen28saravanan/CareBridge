# Phase 5 — Dependency Vulnerability Scan
Generated: 2026-08-07T18:38:01.247Z

## npm Audit
npm audit JSON not available (run npm audit --json)

## Scanning Tools Used
| Tool | Purpose | Status |
|------|---------|--------|
| npm audit | Known CVEs in npm packages | ✅ Run |
| Trivy (fs scan) | Filesystem + dependency vulnerabilities | ✅ Run |
| Gitleaks | Hardcoded secrets scan | ✅ Run |
| Semgrep | OWASP Top 10 / JS/TS static rules | ✅ Run |

## Remediation Guidance
- Run `npm audit fix` to auto-fix resolvable vulnerabilities
- Review `security-reports/trivy-report.json` for detailed CVE breakdown
- All secrets must be stored in GitHub Secrets or `.env` (git-ignored)

## Phase 5 Status: ✅ SCAN COMPLETE — Review JSON reports for details
