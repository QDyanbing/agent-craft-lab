import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import type { SubmitResponseDto } from './questionnaire.dto.js';
import { QuestionnaireError } from './questionnaire.error.js';
import type { Question } from './questionnaire.repository.js';
import { QuestionnaireRepository } from './questionnaire.repository.js';

function validAnswer(question: Question, value: unknown) {
  const isChoice = (index: unknown) =>
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < question.options.length;
  switch (question.type) {
    case 'SINGLE':
      return isChoice(value);
    case 'MULTIPLE':
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        new Set(value).size === value.length &&
        value.every(isChoice)
      );
    case 'TEXT':
      return typeof value === 'string' && value.trim().length > 0;
    case 'NUMBER':
      return typeof value === 'number' && Number.isFinite(value);
  }
}

@Injectable()
export class ResponseService {
  constructor(
    private readonly database: DatabaseService,
    private readonly repository: QuestionnaireRepository,
  ) {}

  submit(survey: string, module: string, question: string, { answer }: SubmitResponseDto) {
    return this.database.transaction('IMMEDIATE', () => {
      const db = this.database.connection;
      const detail = this.repository.readTree(survey);
      if (!db.prepare('SELECT 1 FROM craft_lab_modules WHERE uuid = ? AND questionnaire_uuid = ?').get(module, survey)) {
        throw new QuestionnaireError('module');
      }
      if (!db.prepare('SELECT 1 FROM craft_lab_questions WHERE uuid = ? AND module_uuid = ?').get(question, module)) {
        throw new QuestionnaireError('record');
      }
      const target = detail.modules
        .flatMap((item) => item.questions)
        .find((item) => item.uuid === question);
      const encoded = JSON.stringify(answer);
      if (encoded === undefined) throw new QuestionnaireError('answer');
      const submitted = JSON.parse(encoded);
      if (!target || !validAnswer(target, submitted)) throw new QuestionnaireError('answer');

      const previous = db.prepare('SELECT uuid FROM craft_lab_answer WHERE question_uuid = ?').get(question);
      if (previous) {
        db.prepare(
          'UPDATE craft_lab_answer SET answer = ?, gmt_modified = CURRENT_TIMESTAMP WHERE uuid = ?',
        ).run(JSON.stringify(submitted), previous.uuid);
        return { uuid: String(previous.uuid) };
      }

      const uuid = randomUUID();
      db.prepare('INSERT INTO craft_lab_answer (uuid, question_uuid, answer) VALUES (?, ?, ?)').run(
        uuid,
        question,
        JSON.stringify(submitted),
      );
      return { uuid };
    });
  }
}
