import assert from "node:assert/strict";
import test from "node:test";

import { getSafeNextPath } from "../../src/lib/auth/safe-next-path.ts";

test("accepts normal internal destinations and normalizes dot segments", () => {
    assert.equal(getSafeNextPath("/registro/confirma"), "/registro/confirma");
    assert.equal(getSafeNextPath("/restablecer?token=abc#form"), "/restablecer?token=abc#form");
    assert.equal(getSafeNextPath("/publico/../admin/torneos"), "/admin/torneos");
});

test("rejects external and protocol-relative destinations", () => {
    assert.equal(getSafeNextPath("https://evil.example"), null);
    assert.equal(getSafeNextPath("//evil.example/path"), null);
    assert.equal(getSafeNextPath("///evil.example/path"), null);
    assert.equal(getSafeNextPath("/\\\\evil.example"), null);
    assert.equal(getSafeNextPath("/\\evil.example"), null);
});

test("rejects encoded separators, control characters, and malformed escapes", () => {
    assert.equal(getSafeNextPath("/%2f%2fevil.example"), null);
    assert.equal(getSafeNextPath("/%5cevil.example"), null);
    assert.equal(getSafeNextPath("/login%0d%0aLocation:%20https://evil.example"), null);
    assert.equal(getSafeNextPath("/bad%escape"), null);
    assert.equal(getSafeNextPath("/login\u0000"), null);
});

test("rejects empty and non-root-relative values", () => {
    assert.equal(getSafeNextPath(null), null);
    assert.equal(getSafeNextPath(""), null);
    assert.equal(getSafeNextPath("login"), null);
    assert.equal(getSafeNextPath(" https://evil.example"), null);
});
