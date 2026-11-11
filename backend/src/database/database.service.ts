import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { AppConfig } from '../config.js';
import { migrate } from './migrations.js';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly connection: DatabaseSync;

  constructor(config: AppConfig) {
    if (config.database !== ':memory:' && !config.database.startsWith('file:')) {
      mkdirSync(dirname(config.database), { recursive: true });
    }
    const db = new DatabaseSync(config.database);
    try {
      db.exec('PRAGMA foreign_keys = ON');
      migrate(db);
    } catch (error) {
      db.close();
      throw error;
    }
    this.connection = db;
  }

  transaction<T>(mode: 'DEFERRED' | 'IMMEDIATE', operation: () => T): T {
    this.connection.exec(`BEGIN ${mode}`);
    try {
      const result = operation();
      this.connection.exec('COMMIT');
      return result;
    } catch (error) {
      if (this.connection.isTransaction) this.connection.exec('ROLLBACK');
      throw error;
    }
  }

  onApplicationShutdown() {
    this.connection.close();
  }
}
