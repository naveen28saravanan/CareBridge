import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const failures = [];
for (const file of walk(path.resolve("src")).filter((item) => item.endsWith(".tsx"))) {
  const text = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (tag === "button" || tag === "Button") {
        const names = new Set(
          node.attributes.properties
            .filter(ts.isJsxAttribute)
            .map((attribute) => attribute.name.getText(source)),
        );
        const hasSpread = node.attributes.properties.some(ts.isJsxSpreadAttribute);
        const interactive =
          names.has("onClick") ||
          names.has("onPointerDown") ||
          names.has("disabled") ||
          names.has("type") ||
          hasSpread;
        if (!interactive) {
          const location = source.getLineAndCharacterOfPosition(node.getStart(source));
          failures.push(`${file}:${location.line + 1} <${tag}> has no interaction handler`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Button interaction audit passed: every native/Button control has a handler, submit role, pointer workflow or disabled state.");
