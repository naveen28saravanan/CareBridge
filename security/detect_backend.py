"""
CareBridge Defensive Security Assessment — Helper Scripts
security/detect_backend.py

Detects the backend technology stack from a repository root.
Compatible: Windows + Linux | UTF-8 output | No hardcoded paths
"""
import sys
import json
import pathlib
import argparse


def detect(repo_root: pathlib.Path) -> dict:
    info = {
        "language": None,
        "framework": None,
        "package_manager": None,
        "database": None,
        "auth": [],
        "config_files": [],
    }

    root = repo_root.resolve()

    # Node.js / JavaScript / TypeScript
    pkg = root / "package.json"
    if pkg.exists():
        try:
            data = json.loads(pkg.read_text(encoding="utf-8"))
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            info["language"] = "JavaScript/TypeScript"
            info["package_manager"] = "npm"
            info["config_files"].append("package.json")

            if "vite" in deps:
                info["framework"] = "Vite + React (SPA)"
            elif "next" in deps:
                info["framework"] = "Next.js"
            elif "express" in deps:
                info["framework"] = "Express.js"
            elif "fastify" in deps:
                info["framework"] = "Fastify"
            elif "@nestjs/core" in deps:
                info["framework"] = "NestJS"

            if "@supabase/supabase-js" in deps:
                info["database"] = "Supabase (PostgreSQL)"
            if "mongoose" in deps:
                info["database"] = "MongoDB (Mongoose)"
            if "pg" in deps or "postgres" in deps:
                info["database"] = "PostgreSQL"

            if "firebase" in deps:
                info["auth"].append("Firebase Auth")
            if "jsonwebtoken" in deps or "jose" in deps:
                info["auth"].append("JWT")
            if "@supabase/supabase-js" in deps:
                info["auth"].append("Supabase Auth")
        except Exception as e:
            info["error"] = str(e)

    # Python
    for fname in ["requirements.txt", "pyproject.toml", "Pipfile"]:
        f = root / fname
        if f.exists():
            info["language"] = "Python"
            info["package_manager"] = "pip/poetry/pipenv"
            info["config_files"].append(fname)
            content = f.read_text(encoding="utf-8")
            if "django" in content.lower():
                info["framework"] = "Django"
            elif "fastapi" in content.lower():
                info["framework"] = "FastAPI"
            elif "flask" in content.lower():
                info["framework"] = "Flask"

    # Java
    for fname in ["pom.xml", "build.gradle", "build.gradle.kts"]:
        f = root / fname
        if f.exists():
            info["language"] = "Java/Kotlin"
            info["package_manager"] = "Maven/Gradle"
            info["config_files"].append(fname)
            content = f.read_text(encoding="utf-8")
            if "spring-boot" in content.lower():
                info["framework"] = "Spring Boot"

    # Go
    if (root / "go.mod").exists():
        info["language"] = "Go"
        info["package_manager"] = "go modules"
        info["config_files"].append("go.mod")

    # Ruby
    if (root / "Gemfile").exists():
        info["language"] = "Ruby"
        info["package_manager"] = "bundler"
        info["config_files"].append("Gemfile")
        content = (root / "Gemfile").read_text(encoding="utf-8")
        if "rails" in content.lower():
            info["framework"] = "Ruby on Rails"

    # PHP
    if (root / "composer.json").exists():
        info["language"] = "PHP"
        info["package_manager"] = "composer"
        info["config_files"].append("composer.json")

    # Containers
    for fname in ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"]:
        if (root / fname).exists():
            info["config_files"].append(fname)

    return info


def main():
    parser = argparse.ArgumentParser(description="CareBridge backend technology detector")
    parser.add_argument("--root", default=".", help="Repository root path")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    result = detect(pathlib.Path(args.root))

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("=== CareBridge Backend Technology Detection ===")
        for k, v in result.items():
            if isinstance(v, list):
                v = ", ".join(v) if v else "None"
            print(f"  {k:<20}: {v}")


if __name__ == "__main__":
    main()
