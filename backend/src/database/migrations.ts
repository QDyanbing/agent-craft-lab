import type { DatabaseSync } from 'node:sqlite';

export function migrate(db: DatabaseSync) {
  const version = db.prepare('PRAGMA user_version').get()!.user_version;
  if (version === 1) return;
  if (version !== 0) throw new Error('Unsupported questionnaire database version');

  db.exec('BEGIN');
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS questionnaires (
        uuid TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS questionnaires_unique_name ON questionnaires(name COLLATE NOCASE);
      DROP INDEX IF EXISTS questionnaires_name;
      CREATE TABLE IF NOT EXISTS modules (
        uuid TEXT PRIMARY KEY, survey TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE,
        name TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS modules_survey ON modules(survey);
      CREATE TABLE IF NOT EXISTS questions (
        uuid TEXT PRIMARY KEY, module TEXT NOT NULL REFERENCES modules(uuid) ON DELETE CASCADE,
        type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, options TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS questions_module ON questions(module);
      CREATE TABLE IF NOT EXISTS responses (
        uuid TEXT PRIMARY KEY, survey TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE,
        request_id TEXT NOT NULL, revision TEXT NOT NULL, snapshot TEXT NOT NULL, answers TEXT NOT NULL,
        submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(survey, request_id)
      );
      PRAGMA user_version = 1;
      COMMIT;
    `);
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
