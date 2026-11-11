import assert from "node:assert/strict";
import { execFile } from "node:child_process";
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

test("local upgrade preserves existing questions and answers", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "craftlab-backup-"));
  const filename = join(dir, "legacy.sqlite");
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
      "INSERT INTO responses(uuid,survey,request_id,revision,snapshot,answers) VALUES ('r','s','old','rev','{}',?)",
    )
    .run(JSON.stringify(answers));
  legacy.close();
  try {
    const upgraded = {
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
              type: "TEXT",
              title: "意见",
              description: "",
              options: [],
              answer: "原答案",
            },
          ],
        },
      ],
    };
    const server = await start(filename, t);
    assert.deepEqual(await server.request("GET", "/s"), upgraded);
    const answered = await server.request("POST", "/s/modules/m/questions/q/answer", {
      answer: "原答案",
    });
    assert.equal(typeof answered.uuid, "string");
    await server.stop();
    const db = new DatabaseSync(filename, { readOnly: true });
    assert.equal(db.prepare("PRAGMA user_version").get().user_version, 12);
    const times = db.prepare("SELECT gmt_created, gmt_modified FROM craft_lab_questionnaires").get();
    assert.match(times.gmt_created, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.equal(times.gmt_modified, times.gmt_created);
    const response = db
      .prepare("SELECT uuid, question_uuid, answer, gmt_created, gmt_modified FROM craft_lab_answer")
      .get();
    assert.equal(response.uuid, answered.uuid);
    assert.equal(response.question_uuid, "q");
    assert.equal(JSON.parse(response.answer), "原答案");
    assert.match(response.gmt_created, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.match(response.gmt_modified, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.deepEqual(
      db
        .prepare("PRAGMA table_info(craft_lab_answer)")
        .all()
        .map((column) => column.name),
      ["uuid", "question_uuid", "answer", "gmt_created", "gmt_modified"],
    );
    assert.equal(
      db.prepare("SELECT questionnaire_uuid FROM craft_lab_modules").get().questionnaire_uuid,
      "s",
    );
    assert.equal(db.prepare("SELECT module_uuid FROM craft_lab_questions").get().module_uuid, "m");
    db.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("user_version 2 lowercase question types become uppercase", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "craftlab-lowercase-"));
  const filename = join(dir, "legacy.sqlite");
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE questionnaires (
      uuid TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE modules (
      uuid TEXT PRIMARY KEY,
      questionnaire_uuid TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE,
      name TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE questions (
      uuid TEXT PRIMARY KEY,
      module_uuid TEXT NOT NULL REFERENCES modules(uuid) ON DELETE CASCADE,
      type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, options TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE answer (
      uuid TEXT PRIMARY KEY,
      questionnaire_uuid TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE,
      request_id TEXT NOT NULL, revision TEXT NOT NULL, snapshot TEXT NOT NULL, answers TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(questionnaire_uuid, request_id)
    );
    INSERT INTO questionnaires VALUES ('s','问卷','','2026-01-01 00:00:00','2026-01-01 00:00:00');
    INSERT INTO modules VALUES ('m','s','模块','2026-01-01 00:00:00','2026-01-01 00:00:00');
    INSERT INTO questions VALUES ('q','m','text','意见','','[]','2026-01-01 00:00:00','2026-01-01 00:00:00');
    INSERT INTO answer VALUES ('r','s','r','rev','{}','{"q":"旧答案"}','2026-01-01 00:00:00','2026-01-01 00:00:00');
    PRAGMA user_version = 2;
  `);
  db.close();
  try {
    const server = await start(filename, t);
    assert.deepEqual(await server.request("GET", "/s"), {
      uuid: "s",
      name: "问卷",
      description: "",
      modules: [
        {
          uuid: "m",
          name: "模块",
          questions: [
            {
              uuid: "q",
              type: "TEXT",
              title: "意见",
              description: "",
              options: [],
              answer: "旧答案",
            },
          ],
        },
      ],
    });
    const answered = await server.request("POST", "/s/modules/m/questions/q/answer", {
      answer: "新答案",
    });
    assert.equal(typeof answered.uuid, "string");
    await server.stop();
    const upgraded = new DatabaseSync(filename, { readOnly: true });
    assert.equal(upgraded.prepare("SELECT type FROM craft_lab_questions").get().type, "TEXT");
    assert.equal(
      JSON.parse(
        upgraded.prepare("SELECT answer FROM craft_lab_answer WHERE question_uuid = 'q'").get().answer,
      ),
      "新答案",
    );
    assert.equal(upgraded.prepare("PRAGMA user_version").get().user_version, 12);
    upgraded.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("prefixed schema at user_version 10 upgrades answer rows to questions", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "craftlab-prefixed-"));
  const filename = join(dir, "prefixed.sqlite");
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE craft_lab_questionnaires (
      uuid TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE craft_lab_modules (
      uuid TEXT PRIMARY KEY,
      questionnaire_uuid TEXT NOT NULL REFERENCES craft_lab_questionnaires(uuid) ON DELETE CASCADE,
      name TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE craft_lab_questions (
      uuid TEXT PRIMARY KEY,
      module_uuid TEXT NOT NULL REFERENCES craft_lab_modules(uuid) ON DELETE CASCADE,
      type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, options TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE craft_lab_answer (
      uuid TEXT PRIMARY KEY,
      questionnaire_uuid TEXT NOT NULL REFERENCES craft_lab_questionnaires(uuid) ON DELETE CASCADE,
      request_id TEXT NOT NULL, revision TEXT NOT NULL, snapshot TEXT NOT NULL, answers TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(questionnaire_uuid, request_id)
    );
    INSERT INTO craft_lab_questionnaires VALUES ('s','问卷','','2026-01-01 00:00:00','2026-01-01 00:00:00');
    INSERT INTO craft_lab_modules VALUES ('m','s','模块','2026-01-01 00:00:00','2026-01-01 00:00:00');
    INSERT INTO craft_lab_questions VALUES ('q','m','TEXT','意见','','[]','2026-01-01 00:00:00','2026-01-01 00:00:00');
    INSERT INTO craft_lab_answer VALUES ('r','s','r','rev','{}','{"q":"旧答案"}','2026-01-01 00:00:00','2026-01-01 00:00:00');
    PRAGMA user_version = 10;
  `);
  db.close();
  try {
    const server = await start(filename, t);
    assert.deepEqual(await server.request("GET", "/s"), {
      uuid: "s",
      name: "问卷",
      description: "",
      modules: [
        {
          uuid: "m",
          name: "模块",
          questions: [
            {
              uuid: "q",
              type: "TEXT",
              title: "意见",
              description: "",
              options: [],
              answer: "旧答案",
            },
          ],
        },
      ],
    });
    await server.stop();
    const upgraded = new DatabaseSync(filename, { readOnly: true });
    assert.equal(upgraded.prepare("PRAGMA user_version").get().user_version, 12);
    assert.deepEqual(
      upgraded
        .prepare("PRAGMA table_info(craft_lab_answer)")
        .all()
        .map((column) => column.name),
      ["uuid", "question_uuid", "answer", "gmt_created", "gmt_modified"],
    );
    assert.equal(
      JSON.parse(upgraded.prepare("SELECT answer FROM craft_lab_answer WHERE question_uuid = 'q'").get().answer),
      "旧答案",
    );
    upgraded.close();
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
