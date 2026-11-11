import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { changed, QuestionnaireError } from './questionnaire.error.js';
import type { QuestionDto } from './questionnaire.dto.js';

function optionsJson(dto: QuestionDto) {
  return JSON.stringify(dto.type === 'SINGLE' || dto.type === 'MULTIPLE' ? dto.options : []);
}

@Injectable()
export class StructureService {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.connection;
  }

  private requireModule(survey: string, module: string) {
    if (
      !this.db.prepare('SELECT 1 FROM craft_lab_modules WHERE uuid = ? AND questionnaire_uuid = ?').get(module, survey)
    ) {
      throw new QuestionnaireError('module');
    }
  }

  createModule(survey: string, name: string) {
    return this.database.transaction('IMMEDIATE', () => {
      if (!this.db.prepare('SELECT 1 FROM craft_lab_questionnaires WHERE uuid = ?').get(survey)) {
        throw new QuestionnaireError('questionnaire');
      }
      const uuid = randomUUID();
      this.db
        .prepare('INSERT INTO craft_lab_modules (uuid, questionnaire_uuid, name) VALUES (?, ?, ?)')
        .run(uuid, survey, name);
      return { uuid };
    });
  }

  updateModule(survey: string, module: string, name: string) {
    return changed(
      this.db
        .prepare(
          'UPDATE craft_lab_modules SET name = ?, gmt_modified = CURRENT_TIMESTAMP WHERE uuid = ? AND questionnaire_uuid = ?',
        )
        .run(name, module, survey),
    );
  }

  removeModule(survey: string, module: string) {
    return changed(
      this.db.prepare('DELETE FROM craft_lab_modules WHERE uuid = ? AND questionnaire_uuid = ?').run(module, survey),
    );
  }

  createQuestion(survey: string, module: string, dto: QuestionDto) {
    return this.database.transaction('IMMEDIATE', () => {
      this.requireModule(survey, module);
      const uuid = randomUUID();
      this.db
        .prepare(
          'INSERT INTO craft_lab_questions (uuid, module_uuid, type, title, description, options) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(uuid, module, dto.type, dto.title, dto.description, optionsJson(dto));
      return { uuid };
    });
  }

  updateQuestion(survey: string, module: string, uuid: string, dto: QuestionDto) {
    return this.database.transaction('IMMEDIATE', () => {
      this.requireModule(survey, module);
      const previous = this.db
        .prepare('SELECT type, options FROM craft_lab_questions WHERE uuid = ? AND module_uuid = ?')
        .get(uuid, module);
      if (!previous) throw new QuestionnaireError('record');
      const nextOptions = optionsJson(dto);
      const result = changed(
        this.db
          .prepare(
            'UPDATE craft_lab_questions SET type = ?, title = ?, description = ?, options = ?, gmt_modified = CURRENT_TIMESTAMP WHERE uuid = ? AND module_uuid = ?',
          )
          .run(dto.type, dto.title, dto.description, nextOptions, uuid, module),
      );
      if (String(previous.type) !== dto.type || String(previous.options) !== nextOptions) {
        this.db.prepare('DELETE FROM craft_lab_answer WHERE question_uuid = ?').run(uuid);
      }
      return result;
    });
  }

  removeQuestion(survey: string, module: string, uuid: string) {
    return this.database.transaction('IMMEDIATE', () => {
      this.requireModule(survey, module);
      return changed(
        this.db.prepare('DELETE FROM craft_lab_questions WHERE uuid = ? AND module_uuid = ?').run(uuid, module),
      );
    });
  }
}
