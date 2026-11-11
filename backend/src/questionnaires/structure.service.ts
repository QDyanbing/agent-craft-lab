import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { changed, QuestionnaireError } from './questionnaire.error.js';
import type { QuestionDto } from './questionnaire.dto.js';

function optionsJson(dto: QuestionDto) {
  return JSON.stringify(dto.type === 'single' || dto.type === 'multiple' ? dto.options : []);
}

@Injectable()
export class StructureService {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.connection;
  }

  private requireModule(survey: string, module: string) {
    if (
      !this.db.prepare('SELECT 1 FROM modules WHERE uuid = ? AND survey = ?').get(module, survey)
    ) {
      throw new QuestionnaireError('module');
    }
  }

  createModule(survey: string, name: string) {
    return this.database.transaction('IMMEDIATE', () => {
      if (!this.db.prepare('SELECT 1 FROM questionnaires WHERE uuid = ?').get(survey)) {
        throw new QuestionnaireError('survey');
      }
      const uuid = randomUUID();
      this.db
        .prepare('INSERT INTO modules (uuid, survey, name) VALUES (?, ?, ?)')
        .run(uuid, survey, name);
      return { uuid };
    });
  }

  updateModule(survey: string, module: string, name: string) {
    return changed(
      this.db
        .prepare('UPDATE modules SET name = ? WHERE uuid = ? AND survey = ?')
        .run(name, module, survey),
    );
  }

  removeModule(survey: string, module: string) {
    return changed(
      this.db.prepare('DELETE FROM modules WHERE uuid = ? AND survey = ?').run(module, survey),
    );
  }

  createQuestion(survey: string, module: string, dto: QuestionDto) {
    return this.database.transaction('IMMEDIATE', () => {
      this.requireModule(survey, module);
      const uuid = randomUUID();
      this.db
        .prepare(
          'INSERT INTO questions (uuid, module, type, title, description, options) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(uuid, module, dto.type, dto.title, dto.description, optionsJson(dto));
      return { uuid };
    });
  }

  updateQuestion(survey: string, module: string, uuid: string, dto: QuestionDto) {
    return this.database.transaction('IMMEDIATE', () => {
      this.requireModule(survey, module);
      return changed(
        this.db
          .prepare(
            'UPDATE questions SET type = ?, title = ?, description = ?, options = ? WHERE uuid = ? AND module = ?',
          )
          .run(dto.type, dto.title, dto.description, optionsJson(dto), uuid, module),
      );
    });
  }

  removeQuestion(survey: string, module: string, uuid: string) {
    return this.database.transaction('IMMEDIATE', () => {
      this.requireModule(survey, module);
      return changed(
        this.db.prepare('DELETE FROM questions WHERE uuid = ? AND module = ?').run(uuid, module),
      );
    });
  }
}
