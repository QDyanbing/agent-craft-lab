import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { start } from "./support/server.js";

const exec = promisify(execFile);
const main = fileURLToPath(new URL("../dist/main.js", import.meta.url));

function createLegacySchema(db) {
  db.exec(`
    CREATE TABLE questionnaires (uuid TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL);
    CREATE INDEX questionnaires_name ON questionnaires(name COLLATE NOCASE);
    CREATE TABLE modules (uuid TEXT PRIMARY KEY, survey TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE, name TEXT NOT NULL);
    CREATE TABLE questions (uuid TEXT PRIMARY KEY, module TEXT NOT NULL REFERENCES modules(uuid) ON DELETE CASCADE, type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, options TEXT NOT NULL);
    CREATE TABLE responses (uuid TEXT PRIMARY KEY, survey TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE, request_id TEXT NOT NULL, revision TEXT NOT NULL, snapshot TEXT NOT NULL, answers TEXT NOT NULL, submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(survey, request_id));
  `);
}

test("local upgrade preserves existing questions, answer snapshots and submission IDs", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "craftlab-backup-"));
  const filename = join(dir, "legacy.sqlite");
  const tree = {
    uuid: "s",
    name: "原问卷",
    description: "",
    modules: [
      {
        uuid: "m",
        name: "模块",
        questions: [
          {
            uuid: "q",
            type: "text",
            title: "意见",
            description: "",
            options: [],
          },
        ],
      },
    ],
  };
  const revision = createHash("sha256")
    .update(JSON.stringify(tree))
    .digest("hex");
  const snapshot = { ...tree, revision };
  const answers = { q: "原答案" };
  const legacy = new DatabaseSync(filename);
  createLegacySchema(legacy);
  legacy.exec(`
    INSERT INTO questionnaires VALUES ('s','原问卷','');
    INSERT INTO modules VALUES ('m','s','模块');
    INSERT INTO questions VALUES ('q','m','text','意见','','[]');
  `);
  legacy
    .prepare(
      "INSERT INTO responses(uuid,survey,request_id,revision,snapshot,answers) VALUES ('r','s','old',?,?,?)",
    )
    .run(revision, JSON.stringify(snapshot), JSON.stringify(answers));
  legacy.close();
  try {
    const server = await start(filename, t);
    assert.deepEqual(await server.request("GET", "/s"), snapshot);
    assert.deepEqual(
      await server.request("POST", "/s/responses", {
        requestId: "old",
        revision,
        answers,
      }),
      { uuid: "r" },
    );
    await server.stop();
    const db = new DatabaseSync(filename, { readOnly: true });
    assert.equal(db.prepare("PRAGMA user_version").get().user_version, 1);
    assert.equal(
      db.prepare("SELECT snapshot FROM responses").get().snapshot,
      JSON.stringify(snapshot),
    );
    db.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a conflicting legacy name rolls back migration without dropping old data", async () => {
  const dir = await mkdtemp(join(tmpdir(), "craftlab-migration-"));
  const filename = join(dir, "before.sqlite");
  const db = new DatabaseSync(filename);
  try {
    createLegacySchema(db);
    db.exec(`
      INSERT INTO questionnaires VALUES ('1', 'old', ''), ('2', 'OLD', '');
    `);
    await assert.rejects(
      exec(process.execPath, [main], {
        env: { ...process.env, PORT: "0", QUESTIONNAIRE_DB: filename },
        timeout: 5000,
      }),
      (e) => e.code === 1 && e.stderr.includes("UNIQUE constraint failed"),
    );
    assert.equal(db.prepare("PRAGMA user_version").get().user_version, 0);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM questionnaires").get().n,
      2,
    );
    assert.deepEqual(
      db
        .prepare(
          "SELECT name FROM sqlite_schema WHERE name LIKE 'questionnaires_%' ORDER BY name",
        )
        .all()
        .map((row) => row.name),
      ["questionnaires_name"],
    );
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
