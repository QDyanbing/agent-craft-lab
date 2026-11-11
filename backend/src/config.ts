import { fileURLToPath } from 'node:url';

export class AppConfig {
  constructor(
    readonly host: string,
    readonly port: number,
    readonly database: string,
  ) {}

  static fromEnv(env: NodeJS.ProcessEnv) {
    const port = env.PORT ?? '3000';
    if (!/^\d+$/.test(port) || Number(port) > 65535) throw new Error('Invalid PORT');
    const host = (env.HOST ?? '127.0.0.1').trim();
    if (!host) throw new Error('HOST must be set');
    const database =
      env.QUESTIONNAIRE_DB ??
      fileURLToPath(new URL('../data/questionnaires.sqlite', import.meta.url));
    if (!database.trim()) throw new Error('QUESTIONNAIRE_DB must be set');
    return new AppConfig(host, Number(port), database);
  }
}
