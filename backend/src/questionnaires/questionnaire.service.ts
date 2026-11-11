import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
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
    return this.database.transaction('DEFERRED', () => this.snapshot(uuid));
  }

  // Submission calls this inside its own write transaction.
  snapshot(uuid: string) {
    const detail = this.repository.readTree(uuid);
    const revision = createHash('sha256').update(JSON.stringify(detail)).digest('hex');
    return { ...detail, revision };
  }

  create({ name, description }: QuestionnaireDto) {
    const uuid = randomUUID();
    const result = this.db
      .prepare(
        `INSERT INTO questionnaires (uuid, name, description)
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
          .prepare('UPDATE questionnaires SET name = ?, description = ? WHERE uuid = ?')
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
    return changed(this.db.prepare('DELETE FROM questionnaires WHERE uuid = ?').run(uuid));
  }
}
