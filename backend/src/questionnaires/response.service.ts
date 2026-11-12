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
      const parent = detail.modules.find((item) => item.uuid === module);
      if (!parent) throw new QuestionnaireError('module');
      const target = parent.questions.find((item) => item.uuid === question);
      if (!target) throw new QuestionnaireError('record');
      if (answer === null && target.type !== 'SINGLE') {
        db.prepare('DELETE FROM craft_lab_answer WHERE question_uuid = ?').run(question);
        return null;
      }
      const encoded = JSON.stringify(answer);
      if (encoded === undefined) throw new QuestionnaireError('answer');
      const submitted = JSON.parse(encoded);
      if (!validAnswer(target, submitted)) throw new QuestionnaireError('answer');

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
