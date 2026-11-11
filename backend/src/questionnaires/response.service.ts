import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { DatabaseService } from '../database/database.service.js';
import type { SubmitResponseDto } from './questionnaire.dto.js';
import { QuestionnaireError } from './questionnaire.error.js';
import type { Question } from './questionnaire.repository.js';
import { QuestionnaireService } from './questionnaire.service.js';

function validAnswer(question: Question, value: unknown) {
  const isChoice = (index: unknown) =>
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < question.options.length;
  switch (question.type) {
    case 'single':
      return isChoice(value);
    case 'multiple':
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        new Set(value).size === value.length &&
        value.every(isChoice)
      );
    case 'text':
      return typeof value === 'string' && value.trim().length > 0;
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
  }
}

@Injectable()
export class ResponseService {
  constructor(
    private readonly database: DatabaseService,
    private readonly surveys: QuestionnaireService,
  ) {}

  submit(survey: string, { requestId, revision, answers }: SubmitResponseDto) {
    return this.database.transaction('IMMEDIATE', () => {
      const db = this.database.connection;
      const previous = db
        .prepare(
          'SELECT uuid, revision, answers FROM responses WHERE survey = ? AND request_id = ?',
        )
        .get(survey, requestId);
      if (previous) {
        const stored = JSON.parse(String(previous.answers));
        const submitted = JSON.parse(JSON.stringify(answers));
        if (previous.revision !== revision || !isDeepStrictEqual(stored, submitted)) {
          throw new QuestionnaireError('submitted');
        }
        return { uuid: previous.uuid };
      }

      const snapshot = this.surveys.snapshot(survey);
      if (snapshot.revision !== revision) throw new QuestionnaireError('changed');
      const entries = Object.entries(answers);
      if (!entries.length) throw new QuestionnaireError('emptyAnswer');
      const questions = new Map(
        snapshot.modules.flatMap((m) => m.questions.map((q) => [q.uuid, q] as const)),
      );
      for (const [id, value] of entries) {
        const question = questions.get(id);
        if (!question || !validAnswer(question, value)) throw new QuestionnaireError('answer');
      }
      const uuid = randomUUID();
      db.prepare(
        'INSERT INTO responses (uuid, survey, request_id, revision, snapshot, answers) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(uuid, survey, requestId, revision, JSON.stringify(snapshot), JSON.stringify(answers));
      return { uuid };
    });
  }
}
