import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { QuestionType, SearchDto } from './questionnaire.dto.js';
import { QuestionnaireError } from './questionnaire.error.js';

interface Survey {
  uuid: string;
  name: string;
  description: string;
}

export interface Question {
  uuid: string;
  type: QuestionType;
  title: string;
  description: string;
  options: string[];
}

interface SurveyModule {
  uuid: string;
  name: string;
  questions: Question[];
}

const searchFilter = `WHERE $keyword = '' OR instr(lower(s.name), lower($keyword)) > 0
  OR instr(lower(s.description), lower($keyword)) > 0`;
const summaries = `SELECT s.uuid, s.name, s.description,
  (SELECT count(*) FROM modules m WHERE m.survey = s.uuid) AS moduleCount,
  (SELECT count(*) FROM modules m JOIN questions q ON q.module = m.uuid
    WHERE m.survey = s.uuid) AS questionCount
  FROM questionnaires s ${searchFilter} ORDER BY s.rowid DESC`;

@Injectable()
export class QuestionnaireRepository {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.connection;
  }

  search({ keyword, pageNum, pageSize }: SearchDto) {
    if (pageNum === undefined || pageSize === undefined)
      return this.db.prepare(summaries).all({ keyword });
    const offset = (pageNum - 1) * pageSize;
    if (!Number.isSafeInteger(offset)) throw new QuestionnaireError('pagination');

    return this.database.transaction('DEFERRED', () => {
      const { total } = this.db
        .prepare(`SELECT count(*) AS total FROM questionnaires s ${searchFilter}`)
        .get({ keyword })!;
      const list = this.db
        .prepare(summaries + ' LIMIT $pageSize OFFSET $offset')
        .all({ keyword, pageSize, offset });
      return { list, total };
    });
  }

  private survey(uuid: string) {
    const row = this.db
      .prepare('SELECT uuid, name, description FROM questionnaires WHERE uuid = ?')
      .get(uuid);
    if (!row) throw new QuestionnaireError('survey');
    return {
      uuid: String(row.uuid),
      name: String(row.name),
      description: String(row.description),
    } satisfies Survey;
  }

  // Call inside the read transaction for detail, or the write transaction for submission.
  readTree(uuid: string) {
    const survey = this.survey(uuid);
    const modules = this.db
      .prepare('SELECT uuid, name FROM modules WHERE survey = ? ORDER BY rowid')
      .all(uuid);
    const questions = this.db
      .prepare(
        `
      SELECT q.uuid, q.module, q.type, q.title, q.description, q.options
      FROM questions q JOIN modules m ON m.uuid = q.module WHERE m.survey = ? ORDER BY q.rowid
    `,
      )
      .all(uuid);
    const byModule = new Map<string, SurveyModule>();
    for (const row of modules) {
      const module = { uuid: String(row.uuid), name: String(row.name), questions: [] };
      byModule.set(module.uuid, module);
    }
    for (const row of questions) {
      byModule.get(String(row.module))!.questions.push({
        uuid: String(row.uuid),
        type: row.type as QuestionType,
        title: String(row.title),
        description: String(row.description),
        options: JSON.parse(String(row.options)),
      });
    }
    return { ...survey, modules: [...byModule.values()] };
  }
}
