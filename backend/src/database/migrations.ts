import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

const questionTypes = ['single', 'multiple', 'text', 'number'];

function hasTable(db: DatabaseSync, name: string) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));
}

function uppercaseQuestionTypes(db: DatabaseSync) {
  const questionTable = hasTable(db, 'craft_lab_questions')
    ? 'craft_lab_questions'
    : hasTable(db, 'questions')
      ? 'questions'
      : null;
  if (!questionTable) return;
  db.exec(
    `UPDATE ${questionTable} SET type = UPPER(type) WHERE type IN (${questionTypes.map((type) => `'${type}'`).join(', ')})`,
  );
  for (const table of ['responses', 'answer', 'craft_lab_answer']) {
    if (!hasColumn(db, table, 'snapshot')) continue;
    const update = db.prepare(`UPDATE ${table} SET snapshot = ? WHERE uuid = ?`);
    for (const row of db.prepare(`SELECT uuid, snapshot FROM ${table}`).all()) {
      const snapshot = JSON.parse(String(row.snapshot));
      for (const module of snapshot.modules ?? []) {
        for (const question of module.questions ?? []) {
          if (typeof question.type === 'string') question.type = question.type.toUpperCase();
        }
      }
      update.run(JSON.stringify(snapshot), row.uuid);
    }
  }
}

function hasColumn(db: DatabaseSync, table: string, name: string) {
  return hasTable(db, table) && db.prepare(`PRAGMA table_info(${table})`).all().some((column) => column.name === name);
}

function renameColumn(db: DatabaseSync, table: string, from: string, to: string) {
  if (!hasColumn(db, table, from) || hasColumn(db, table, to)) return;
  db.exec(`ALTER TABLE ${table} RENAME COLUMN ${from} TO ${to}`);
}

function renameTimestamps(db: DatabaseSync) {
  for (const table of ['questionnaires', 'modules', 'questions', 'responses']) {
    renameColumn(db, table, 'created_at', 'gmt_created');
    renameColumn(db, table, 'updated_at', 'gmt_modified');
  }
  renameColumn(db, 'responses', 'submitted_at', 'gmt_submitted');
}

function ensureTimestamps(db: DatabaseSync) {
  if (!hasTable(db, 'questionnaires')) return;
  if (
    hasColumn(db, 'questionnaires', 'gmt_created') ||
    hasColumn(db, 'questionnaires', 'gmt_create')
  ) {
    return;
  }
  if (hasColumn(db, 'questionnaires', 'created_at')) {
    renameTimestamps(db);
    return;
  }

  db.exec(`
    CREATE TABLE questionnaires_next (
      uuid TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO questionnaires_next (uuid, name, description, gmt_created, gmt_modified)
      SELECT uuid, name, description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM questionnaires;
    CREATE TABLE modules_next (
      uuid TEXT PRIMARY KEY,
      questionnaire_uuid TEXT NOT NULL REFERENCES questionnaires_next(uuid) ON DELETE CASCADE,
      name TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO modules_next (uuid, questionnaire_uuid, name, gmt_created, gmt_modified)
      SELECT uuid, survey, name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM modules;
    CREATE TABLE questions_next (
      uuid TEXT PRIMARY KEY,
      module_uuid TEXT NOT NULL REFERENCES modules_next(uuid) ON DELETE CASCADE,
      type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, options TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO questions_next (uuid, module_uuid, type, title, description, options, gmt_created, gmt_modified)
      SELECT uuid, module, type, title, description, options, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM questions;
    CREATE TABLE responses_next (
      uuid TEXT PRIMARY KEY,
      questionnaire_uuid TEXT NOT NULL REFERENCES questionnaires_next(uuid) ON DELETE CASCADE,
      request_id TEXT NOT NULL, revision TEXT NOT NULL, snapshot TEXT NOT NULL, answers TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(questionnaire_uuid, request_id)
    );
    INSERT INTO responses_next (
      uuid, questionnaire_uuid, request_id, revision, snapshot, answers, gmt_created, gmt_modified
    )
      SELECT uuid, survey, request_id, revision, snapshot, answers, submitted_at, submitted_at
      FROM responses;
    DROP TABLE responses;
    DROP TABLE questions;
    DROP TABLE modules;
    DROP TABLE questionnaires;
    ALTER TABLE questionnaires_next RENAME TO questionnaires;
    ALTER TABLE modules_next RENAME TO modules;
    ALTER TABLE questions_next RENAME TO questions;
    ALTER TABLE responses_next RENAME TO answer;
    CREATE UNIQUE INDEX questionnaires_unique_name ON questionnaires(name COLLATE NOCASE);
    CREATE INDEX modules_questionnaire_uuid ON modules(questionnaire_uuid);
    CREATE INDEX questions_module_uuid ON questions(module_uuid);
  `);
}

function renameQuestionnaireColumn(db: DatabaseSync) {
  if (!hasTable(db, 'modules') && !hasTable(db, 'responses')) return;
  for (const table of ['modules', 'responses']) {
    renameColumn(db, table, 'survey', 'questionnaire_uuid');
  }
  if (!hasTable(db, 'modules')) return;
  db.exec('DROP INDEX IF EXISTS modules_survey');
  db.exec(
    'CREATE INDEX IF NOT EXISTS modules_questionnaire_uuid ON modules(questionnaire_uuid)',
  );
}

function renameModuleColumn(db: DatabaseSync) {
  if (!hasTable(db, 'questions')) return;
  renameColumn(db, 'questions', 'module', 'module_uuid');
  db.exec('DROP INDEX IF EXISTS questions_module');
  db.exec('CREATE INDEX IF NOT EXISTS questions_module_uuid ON questions(module_uuid)');
}

function renameAnswerTable(db: DatabaseSync) {
  if (db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'responses'").get()) {
    db.exec('ALTER TABLE responses RENAME TO answer');
  }
}

function dropSubmittedColumn(db: DatabaseSync) {
  if (hasColumn(db, 'answer', 'gmt_submitted')) {
    db.exec('ALTER TABLE answer DROP COLUMN gmt_submitted');
  }
}

function renameCreatedColumn(db: DatabaseSync) {
  for (const table of ['questionnaires', 'modules', 'questions', 'answer', 'responses']) {
    renameColumn(db, table, 'gmt_create', 'gmt_created');
  }
}

function prefixTables(db: DatabaseSync) {
  const renames = [
    ['questionnaires', 'craft_lab_questionnaires'],
    ['modules', 'craft_lab_modules'],
    ['questions', 'craft_lab_questions'],
    ['answer', 'craft_lab_answer'],
  ] as const;
  for (const [from, to] of renames) {
    if (hasTable(db, from) && !hasTable(db, to)) {
      db.exec(`ALTER TABLE ${from} RENAME TO ${to}`);
    }
  }
  if (!hasTable(db, 'craft_lab_questionnaires')) return;
  db.exec(`
    DROP INDEX IF EXISTS questionnaires_unique_name;
    CREATE UNIQUE INDEX IF NOT EXISTS craft_lab_questionnaires_unique_name
      ON craft_lab_questionnaires(name COLLATE NOCASE);
    DROP INDEX IF EXISTS modules_questionnaire_uuid;
    DROP INDEX IF EXISTS modules_survey;
    CREATE INDEX IF NOT EXISTS craft_lab_modules_questionnaire_uuid
      ON craft_lab_modules(questionnaire_uuid);
    DROP INDEX IF EXISTS questions_module_uuid;
    DROP INDEX IF EXISTS questions_module;
    CREATE INDEX IF NOT EXISTS craft_lab_questions_module_uuid
      ON craft_lab_questions(module_uuid);
  `);
}

function normalizeAnswerByQuestion(db: DatabaseSync) {
  if (!hasTable(db, 'craft_lab_answer')) return;
  if (hasColumn(db, 'craft_lab_answer', 'question_uuid') && hasColumn(db, 'craft_lab_answer', 'answer')) {
    return;
  }
  if (!hasColumn(db, 'craft_lab_answer', 'answers')) {
    return;
  }

  db.exec(`
    CREATE TABLE craft_lab_answer_next (
      uuid TEXT PRIMARY KEY,
      question_uuid TEXT NOT NULL UNIQUE REFERENCES craft_lab_questions(uuid) ON DELETE CASCADE,
      answer TEXT NOT NULL,
      gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const insert = db.prepare(`
    INSERT INTO craft_lab_answer_next (uuid, question_uuid, answer, gmt_created, gmt_modified)
    VALUES (?, ?, ?, ?, ?)
  `);
  const questionExists = db.prepare('SELECT 1 FROM craft_lab_questions WHERE uuid = ?');
  const source = db
    .prepare(
      `SELECT uuid, answers, gmt_created, gmt_modified FROM craft_lab_answer
       WHERE rowid IN (
         SELECT MAX(rowid) FROM craft_lab_answer GROUP BY questionnaire_uuid
       )`,
    )
    .all();
  for (const row of source) {
    const answers = JSON.parse(String(row.answers)) as Record<string, unknown>;
    for (const [questionUuid, value] of Object.entries(answers)) {
      if (!questionExists.get(questionUuid)) continue;
      insert.run(
        randomUUID(),
        questionUuid,
        JSON.stringify(value),
        row.gmt_created,
        row.gmt_modified,
      );
    }
  }
  db.exec(`
    DROP TABLE craft_lab_answer;
    ALTER TABLE craft_lab_answer_next RENAME TO craft_lab_answer;
  `);
}

export function migrate(db: DatabaseSync) {
  const version = db.prepare('PRAGMA user_version').get()!.user_version;
  if (version === 12) return;
  if (
    version !== 0 &&
    version !== 1 &&
    version !== 2 &&
    version !== 3 &&
    version !== 4 &&
    version !== 5 &&
    version !== 6 &&
    version !== 7 &&
    version !== 8 &&
    version !== 9 &&
    version !== 10 &&
    version !== 11
  ) {
    throw new Error('Unsupported questionnaire database version');
  }

  db.exec('BEGIN');
  try {
    if (version === 0) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS questionnaires (
          uuid TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
          gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE UNIQUE INDEX IF NOT EXISTS questionnaires_unique_name ON questionnaires(name COLLATE NOCASE);
        DROP INDEX IF EXISTS questionnaires_name;
        CREATE TABLE IF NOT EXISTS modules (
          uuid TEXT PRIMARY KEY,
          questionnaire_uuid TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE,
          name TEXT NOT NULL,
          gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS questions (
          uuid TEXT PRIMARY KEY,
          module_uuid TEXT NOT NULL REFERENCES modules(uuid) ON DELETE CASCADE,
          type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, options TEXT NOT NULL,
          gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      if (
        !db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'responses'").get() &&
        !db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'answer'").get() &&
        !db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'craft_lab_answer'").get()
      ) {
        db.exec(`
          CREATE TABLE answer (
            uuid TEXT PRIMARY KEY,
            question_uuid TEXT NOT NULL UNIQUE REFERENCES questions(uuid) ON DELETE CASCADE,
            answer TEXT NOT NULL,
            gmt_created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            gmt_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }
    }
    uppercaseQuestionTypes(db);
    if (!hasTable(db, 'craft_lab_questionnaires')) {
      ensureTimestamps(db);
      renameQuestionnaireColumn(db);
      renameModuleColumn(db);
      renameAnswerTable(db);
      dropSubmittedColumn(db);
      renameCreatedColumn(db);
      prefixTables(db);
    }
    normalizeAnswerByQuestion(db);
    db.exec('PRAGMA user_version = 12');
    db.exec('COMMIT');
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
