import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import type { MockContext, MockMethod, MockResponse, MockRoute } from '../plugins/mock';

interface QuestionnaireRoute {
  method: MockMethod;
  path: string;
  handle: (
    params: MockContext['params'],
    body: unknown,
    query: Record<string, string>,
  ) => MockResponse;
}

// Use the production handlers with an isolated, in-memory SQLite database in mock mode.
const { createQuestionnaireRoutes } = createRequire(import.meta.url)(
  '../../backend/src/questionnaires.js',
) as { createQuestionnaireRoutes: (db: DatabaseSync) => QuestionnaireRoute[] };

const db = new DatabaseSync(':memory:');
const routes: MockRoute[] = createQuestionnaireRoutes(db).map(({ method, path, handle }) => ({
  method,
  path,
  handler: ({ params, body, url }) => handle(params, body, Object.fromEntries(url.searchParams)),
}));
import.meta.hot?.dispose(() => db.close());

export default routes;
