import Fastify from "fastify";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { createQuestionnaireRoutes } from "./questionnaires.js";

const server = Fastify({ logger: true });
const filename =
  process.env.QUESTIONNAIRE_DB ??
  fileURLToPath(new URL("../data/questionnaires.sqlite", import.meta.url));
if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true });
const db = new DatabaseSync(filename);
for (const { method, path, handle } of createQuestionnaireRoutes(db)) {
  server.route({
    method,
    url: path,
    handler(request, reply) {
      const result = handle(request.params, request.body, request.query);
      return reply.code(result.status).send(result.body);
    },
  });
}
server.addHook("onClose", async () => db.close());

server.get("/api/health", async () => ({
  success: true,
  data: { status: "ok" },
}));

try {
  await server.listen({
    host: process.env.HOST ?? "127.0.0.1",
    port: Number(process.env.PORT ?? 3000),
  });
} catch (error) {
  server.log.error(error);
  process.exitCode = 1;
}
