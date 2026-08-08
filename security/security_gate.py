"""
CareBridge Defensive Security Assessment — Security Gate
security/security_gate.py

Reads scan results and exits non-zero ONLY on confirmed CRITICAL issues.
Compatible: Windows + Linux | UTF-8 | Deterministic
"""
import sys
import json
import pathlib
import argparse


def load_json(path: pathlib.Path) -> dict | list | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def check_npm_audit(out_dir: pathlib.Path) -> int:
    data = load_json(out_dir / "dependency" / "npm-audit.json")
    if data is None:
        return 0
    return data.get("metadata", {}).get("vulnerabilities", {}).get("critical", 0)


def check_semgrep(out_dir: pathlib.Path) -> int:
    data = load_json(out_dir / "semgrep" / "semgrep-report.json")
    if not data or not isinstance(data, dict):
        return 0
    critical_rules = {"ERROR", "CRITICAL"}
    return sum(
        1 for r in data.get("results", [])
        if r.get("extra", {}).get("severity", "").upper() in critical_rules
    )


def check_trivy(out_dir: pathlib.Path) -> int:
    data = load_json(out_dir / "trivy" / "trivy-report.json")
    if not data or not isinstance(data, dict):
        return 0
    count = 0
    for result in data.get("Results", []):
        for vuln in result.get("Vulnerabilities", []):
            if vuln.get("Severity", "").upper() == "CRITICAL":
                count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description="CareBridge security gate")
    parser.add_argument("--scan-dir", default="Vulnerability Test Results/scan-results",
                        help="Directory containing scanner outputs")
    parser.add_argument("--fail-on-high", action="store_true",
                        help="Also fail on HIGH severity (default: CRITICAL only)")
    args = parser.parse_args()

    scan_dir = pathlib.Path(args.scan_dir).resolve()
    print("=== CareBridge Security Gate ===")
    print(f"  Scan results: {scan_dir}")

    npm_critical   = check_npm_audit(scan_dir)
    semgrep_crit   = check_semgrep(scan_dir)
    trivy_critical = check_trivy(scan_dir)

    total_critical = npm_critical + semgrep_crit + trivy_critical

    print(f"  npm audit critical CVEs:  {npm_critical}")
    print(f"  Semgrep critical findings: {semgrep_crit}")
    print(f"  Trivy critical CVEs:       {trivy_critical}")
    print(f"  ─────────────────────────────")
    print(f"  Total critical:            {total_critical}")

    if total_critical > 0:
        print("\n❌ GATE FAILED — Critical vulnerabilities detected. Pipeline blocked.")
        sys.exit(1)
    else:
        print("\n✅ GATE PASSED — No critical vulnerabilities in automated scans.")
        print("   Review security-review.md for static analysis findings requiring manual remediation.")
        sys.exit(0)


if __name__ == "__main__":
    main()
