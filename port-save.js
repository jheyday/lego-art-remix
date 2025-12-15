#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function isPlainObject(v) {
    return v != null && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(base, override) {
    if (Array.isArray(base) && Array.isArray(override)) {
        return override;
    }

    if (isPlainObject(base) && isPlainObject(override)) {
        const out = { ...base };
        for (const [k, v] of Object.entries(override)) {
            if (v === undefined) {
                continue;
            }
            if (k in base) {
                out[k] = deepMerge(base[k], v);
            } else {
                out[k] = v;
            }
        }
        return out;
    }

    return override !== undefined ? override : base;
}

function main() {
    const repoRoot = process.cwd();
    const savesDir = path.join(repoRoot, "saves");

    const oldPath = path.join(savesDir, "old.json");
    const newPath = path.join(savesDir, "new.json");
    const outPath = path.join(savesDir, "old_ported.json");

    const oldState = JSON.parse(fs.readFileSync(oldPath, "utf8"));
    const newState = JSON.parse(fs.readFileSync(newPath, "utf8"));

    const ported = deepMerge(newState, oldState);

    // Ensure new-format fields exist (loader prefers these when present).
    if (ported.originalInputImageDataUrl == null) {
        ported.originalInputImageDataUrl = oldState.originalInputImageDataUrl || oldState.inputImageDataUrl || null;
    }
    if (ported.originalInputDepthDataUrl == null) {
        ported.originalInputDepthDataUrl = oldState.originalInputDepthDataUrl || oldState.inputDepthDataUrl || null;
    }

    fs.writeFileSync(outPath, JSON.stringify(ported, null, 2) + "\n", "utf8");

    const oldKeys = Object.keys(oldState).sort();
    const newKeys = Object.keys(newState).sort();
    const outKeys = Object.keys(ported).sort();

    const onlyInOld = oldKeys.filter((k) => !outKeys.includes(k));
    const onlyInNewMissingFromOut = newKeys.filter((k) => !outKeys.includes(k));

    console.log(`Wrote ${path.relative(repoRoot, outPath)}`);
    if (onlyInOld.length) {
        console.log("Warning: keys from old.json missing in output:", onlyInOld);
    }
    if (onlyInNewMissingFromOut.length) {
        console.log("Warning: keys from new.json missing in output:", onlyInNewMissingFromOut);
    }
}

main();
