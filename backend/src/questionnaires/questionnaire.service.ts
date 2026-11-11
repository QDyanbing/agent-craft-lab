import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { changed, QuestionnaireError } from './questionnaire.error.js';
import type { QuestionnaireDto, SearchDto } from './questionnaire.dto.js';
import { QuestionnaireRepository } from './questionnaire.repository.js';

@Injectable()
export class QuestionnaireService {
  constructor(
    private readonly database: DatabaseService,
    private readonly repository: QuestionnaireRepository,
  ) {}

  private get db() {
    return this.database.connection;
  }

  search(query: SearchDto) {
    return this.repository.search(query);
  }

  detail(uuid: string) {
    return this.database.transaction('DEFERRED', () => {
      const detail = this.repository.readTree(uuid);
      const rows = this.db
        .prepare(
          `
          SELECT a.question_uuid, a.answer
          FROM craft_lab_answer a
          JOIN craft_lab_questions q ON q.uuid = a.question_uuid
          JOIN craft_lab_modules m ON m.uuid = q.module_uuid
          WHERE m.questionnaire_uuid = ?
        `,
        )
        .all(uuid);
      if (!rows.length) return detail;
      const stored = Object.fromEntries(
        rows.map((row) => [String(row.question_uuid), JSON.parse(String(row.answer))]),
      );
      return {
        ...detail,
        modules: detail.modules.map((module) => ({
          ...module,
          questions: module.questions.map((question) =>
            Object.hasOwn(stored, question.uuid)
              ? { ...question, answer: stored[question.uuid] }
              : question,
          ),
        })),
      };
    });
  }

  create({ name, description }: QuestionnaireDto) {
    const uuid = randomUUID();
    const result = this.db
      .prepare(
        `INSERT INTO craft_lab_questionnaires (uuid, name, description)
      VALUES (?, ?, ?) ON CONFLICT(name COLLATE NOCASE) DO NOTHING`,
      )
      .run(uuid, name, description);
    if (!result.changes) throw new QuestionnaireError('duplicateName');
    return { uuid };
  }

  update(uuid: string, { name, description }: QuestionnaireDto) {
    try {
      return changed(
        this.db
          .prepare(
            'UPDATE craft_lab_questionnaires SET name = ?, description = ?, gmt_modified = CURRENT_TIMESTAMP WHERE uuid = ?',
          )
          .run(name, description, uuid),
      );
    } catch (error) {
      // SQLITE_CONSTRAINT_UNIQUE from the case-insensitive name index.
      if (error instanceof Error && 'errcode' in error && error.errcode === 2067) {
        throw new QuestionnaireError('duplicateName');
      }
      throw error;
    }
  }

  remove(uuid: string) {
    return changed(this.db.prepare('DELETE FROM craft_lab_questionnaires WHERE uuid = ?').run(uuid));
  }
}
