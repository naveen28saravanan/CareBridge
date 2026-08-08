"""
CareBridge Defensive Security Assessment — Dependency Scanner Runner
security/run_security_scans.py

Detects and runs available security scanners.
Compatible: Windows + Linux | UTF-8 | No hardcoded paths
"""
import sys
import json
import shutil
import subprocess
import pathlib
import argparse
import datetime


def run(cmd: list[str], cwd: pathlib.Path, output_file: pathlib.Path | None = None) -> dict:
    """Run a scanner command and return result metadata."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=str(cwd), timeout=120
        )
        stdout = result.stdout
        if output_file:
            output_file.write_text(stdout or "{}", encoding="utf-8")
        return {
            "command": " ".join(cmd),
            "exit_code": result.returncode,
            "available": True,
            "output_file": str(output_file) if output_file else None,
            "error": result.stderr[:500] if result.returncode != 0 else None,
        }
    except FileNotFoundError:
        return {"command": " ".join(cmd), "available": False, "error": "Not installed"}
    except subprocess.TimeoutExpired:
        return {"command": " ".join(cmd), "available": True, "error": "Timed out after 120s"}
    except Exception as e:
        return {"command": " ".join(cmd), "available": False, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="CareBridge security scanner runner")
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--out", default="Vulnerability Test Results/scan-results",
                        help="Output directory")
    args = parser.parse_args()

    root = pathlib.Path(args.root).resolve()
    out = root / args.out
    out.mkdir(parents=True, exist_ok=True)

    results = []
    ts = datetime.datetime.utcnow().isoformat()

    print(f"[{ts}] CareBridge security scan runner starting...")
    print(f"  Repository: {root}")
    print(f"  Output: {out}")

    # 1. npm audit (Node.js)
    if (root / "package.json").exists() and shutil.which("npm"):
        dep_out = out / "dependency"
        dep_out.mkdir(exist_ok=True)
        r = run(
            ["npm", "audit", "--omit=dev", "--json"],
            cwd=root,
            output_file=dep_out / "npm-audit.json"
        )
        r["scanner"] = "npm audit"
        results.append(r)
        status = "✅" if r.get("available") else "⚠️"
        print(f"  {status} npm audit: exit={r.get('exit_code','N/A')}")
    else:
        results.append({"scanner": "npm audit", "available": False, "error": "npm not found or no package.json",
                        "install": "https://nodejs.org/"})
        print("  ⚠️  npm audit: not available")

    # 2. Semgrep
    if shutil.which("semgrep"):
        sem_out = out / "semgrep"
        sem_out.mkdir(exist_ok=True)
        r = run(
            ["semgrep", "--config=p/owasp-top-ten", "--config=p/javascript",
             "--config=p/secrets", "--json", "--no-error", "."],
            cwd=root,
            output_file=sem_out / "semgrep-report.json"
        )
        r["scanner"] = "semgrep"
        results.append(r)
        print(f"  ✅ Semgrep: exit={r.get('exit_code','N/A')}")
    else:
        results.append({
            "scanner": "semgrep", "available": False,
            "error": "Semgrep not installed",
            "install": "pip install semgrep  OR  https://semgrep.dev/docs/getting-started/"
        })
        print("  ⚠️  Semgrep: not installed (pip install semgrep)")

    # 3. Trivy
    if shutil.which("trivy"):
        trivy_out = out / "trivy"
        trivy_out.mkdir(exist_ok=True)
        r = run(
            ["trivy", "fs", ".", "--format", "json",
             "--output", str(trivy_out / "trivy-report.json"),
             "--severity", "CRITICAL,HIGH,MEDIUM", "--exit-code", "0"],
            cwd=root
        )
        r["scanner"] = "trivy"
        results.append(r)
        print(f"  ✅ Trivy: exit={r.get('exit_code','N/A')}")
    else:
        results.append({
            "scanner": "trivy", "available": False,
            "error": "Trivy not installed",
            "install": "https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
        })
        print("  ⚠️  Trivy: not installed")

    # 4. Gitleaks
    if shutil.which("gitleaks"):
        gl_out = out / "gitleaks"
        gl_out.mkdir(exist_ok=True)
        r = run(
            ["gitleaks", "detect", "--source", ".", "--report-format", "json",
             "--report-path", str(gl_out / "gitleaks-report.json"), "--no-banner"],
            cwd=root
        )
        r["scanner"] = "gitleaks"
        results.append(r)
        print(f"  ✅ Gitleaks: exit={r.get('exit_code','N/A')}")
    else:
        results.append({
            "scanner": "gitleaks", "available": False,
            "error": "Gitleaks not installed",
            "install": "https://github.com/gitleaks/gitleaks#installing"
        })
        print("  ⚠️  Gitleaks: not installed")

    # 5. pip-audit (Python projects)
    if (root / "requirements.txt").exists() or (root / "pyproject.toml").exists():
        if shutil.which("pip-audit"):
            r = run(["pip-audit", "--format=json", "--output", str(out / "dependency" / "pip-audit.json")], cwd=root)
            r["scanner"] = "pip-audit"
            results.append(r)
        else:
            results.append({
                "scanner": "pip-audit", "available": False,
                "error": "pip-audit not installed",
                "install": "pip install pip-audit"
            })

    # Write scan summary
    summary = {
        "timestamp": ts,
        "repository": str(root),
        "scanners": results,
        "available": [r["scanner"] for r in results if r.get("available")],
        "unavailable": [r["scanner"] for r in results if not r.get("available")],
    }
    summary_path = out / "scan-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✅ Scan summary written to: {summary_path}")
    print(f"   Available:   {', '.join(summary['available']) or 'none'}")
    print(f"   Unavailable: {', '.join(summary['unavailable']) or 'none'}")

    # Return non-zero if no scanners ran
    if not summary["available"]:
        print("\n❌ No security scanners were available. Install at least npm audit.")
        sys.exit(1)


if __name__ == "__main__":
    main()
