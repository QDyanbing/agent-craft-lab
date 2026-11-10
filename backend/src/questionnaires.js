import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

function fail(statusCode, key, message) {
  throw Object.assign(new Error(message), {
    statusCode,
    errorKey: "questionnaire:errors." + key,
  });
}

function field(value, required = false) {
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || (required && !value.trim()))
    fail(400, "required", "请检查必填字段");
  return value.trim();
}

function questionFields(body) {
  const { type } = body;
  if (!["single", "multiple", "text", "number"].includes(type))
    fail(400, "type", "无效的题目类型");
  let options = [];
  if (type === "single" || type === "multiple") {
    if (!Array.isArray(body.options) || !body.options.length)
      fail(400, "options", "请添加选项");
    options = body.options.map((option) => field(option, true));
  }
  return [
    type,
    field(body.title, true),
    field(body.description),
    JSON.stringify(options),
  ];
}

function validAnswer(question, value) {
  const isChoice = (index) =>
    Number.isInteger(index) && index >= 0 && index < question.options.length;
  switch (question.type) {
    case "single":
      return isChoice(value);
    case "multiple":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        new Set(value).size === value.length &&
        value.every(isChoice)
      );
    case "text":
      return typeof value === "string" && value.trim().length > 0;
    case "number":
      return Number.isFinite(value);
    default:
      return false;
  }
}

export function createQuestionnaireRoutes(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS questionnaires (
      uuid TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS questionnaires_name ON questionnaires(name COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS modules (
      uuid TEXT PRIMARY KEY, survey TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE,
      name TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS modules_survey ON modules(survey);
    CREATE TABLE IF NOT EXISTS questions (
      uuid TEXT PRIMARY KEY, module TEXT NOT NULL REFERENCES modules(uuid) ON DELETE CASCADE,
      type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, options TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS questions_module ON questions(module);
    CREATE TABLE IF NOT EXISTS responses (
      uuid TEXT PRIMARY KEY, survey TEXT NOT NULL REFERENCES questionnaires(uuid) ON DELETE CASCADE,
      request_id TEXT NOT NULL, revision TEXT NOT NULL, snapshot TEXT NOT NULL, answers TEXT NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(survey, request_id)
    );
  `);

  const base = "/api/questionnaires";
  const survey = base + "/:survey";
  const modules = survey + "/modules";
  const module = modules + "/:module";
  const questions = module + "/questions";
  const question = questions + "/:question";
  const routes = [];
  function route(method, path, action) {
    routes.push({
      method,
      path,
      handle(params, body = {}, query = {}) {
        try {
          if (body === null || typeof body !== "object" || Array.isArray(body))
            fail(400, "form", "无效的表单");
          const data = action(params, body, query);
          return {
            status: method === "POST" ? 201 : 200,
            body: { success: true, data },
          };
        } catch (error) {
          if (!error.statusCode) throw error;
          return {
            status: error.statusCode,
            body: {
              success: false,
              errorKey: error.errorKey,
              errorMessage: error.message,
            },
          };
        }
      },
    });
  }

  function surveyRow(uuid) {
    return (
      db
        .prepare(
          "SELECT uuid, name, description FROM questionnaires WHERE uuid = ?",
        )
        .get(uuid) ?? fail(404, "survey", "问卷不存在")
    );
  }
  function moduleRow(params) {
    return (
      db
        .prepare("SELECT uuid, name FROM modules WHERE uuid = ? AND survey = ?")
        .get(params.module, params.survey) ?? fail(404, "module", "模块不存在")
    );
  }
  function changed(result) {
    if (!result.changes) fail(404, "record", "记录不存在");
    return null;
  }

  const keywordFilter = `WHERE $keyword = '' OR instr(lower(s.name), lower($keyword)) > 0
    OR instr(lower(s.description), lower($keyword)) > 0`;
  const summaries = `
    SELECT s.uuid, s.name, s.description, count(DISTINCT m.uuid) AS moduleCount,
      count(q.uuid) AS questionCount FROM questionnaires s
    LEFT JOIN modules m ON m.survey = s.uuid LEFT JOIN questions q ON q.module = m.uuid
    ${keywordFilter} GROUP BY s.uuid ORDER BY s.rowid DESC`;
  route("GET", base, (_, __, query) => {
    const keyword = field(query.keyword);
    if (query.pageNum === undefined && query.pageSize === undefined)
      return db.prepare(summaries).all({ keyword });

    const pageNum = Number(query.pageNum);
    const pageSize = Number(query.pageSize);
    const offset = (pageNum - 1) * pageSize;
    if (
      !Number.isSafeInteger(pageNum) ||
      pageNum < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      !Number.isSafeInteger(offset)
    )
      fail(400, "pagination", "无效的分页参数");

    const { total } = db
      .prepare(
        `SELECT count(*) AS total FROM questionnaires s ${keywordFilter}`,
      )
      .get({ keyword });
    const list = db
      .prepare(summaries + " LIMIT $pageSize OFFSET $offset")
      .all({ keyword, pageSize, offset });
    return { list, total };
  });
  const nameAvailable = `NOT EXISTS (
    SELECT 1 FROM questionnaires WHERE name = $name COLLATE NOCASE
  )`;
  function duplicateName() {
    fail(409, "duplicateName", "问卷名称已存在，请换一个名称");
  }
  route("POST", base, (_, body) => {
    const uuid = randomUUID();
    const result = db
      .prepare(
        `INSERT INTO questionnaires (uuid, name, description)
      SELECT $uuid, $name, $description WHERE ${nameAvailable}`,
      )
      .run({
        uuid,
        name: field(body.name, true),
        description: field(body.description),
      });
    if (!result.changes) duplicateName();
    return { uuid };
  });
  function surveyDetail(uuid) {
    const data = surveyRow(uuid);
    const modules = db
      .prepare("SELECT uuid, name FROM modules WHERE survey = ? ORDER BY rowid")
      .all(uuid);
    const questions = db
      .prepare(
        `SELECT q.uuid, q.module, q.type, q.title, q.description, q.options
      FROM questions q JOIN modules m ON m.uuid = q.module WHERE m.survey = ? ORDER BY q.rowid`,
      )
      .all(uuid);
    const byModule = new Map(
      modules.map((m) => [m.uuid, { ...m, questions: [] }]),
    );
    for (const { module, options, ...q } of questions) {
      byModule
        .get(module)
        .questions.push({ ...q, options: JSON.parse(options) });
    }
    const detail = { ...data, modules: [...byModule.values()] };
    const revision = createHash("sha256")
      .update(JSON.stringify(detail))
      .digest("hex");
    return { ...detail, revision };
  }
  route("GET", survey, ({ survey }) => surveyDetail(survey));
  route("PUT", survey, ({ survey }, body) => {
    const result = db
      .prepare(
        `UPDATE questionnaires SET name = $name, description = $description
      WHERE uuid = $uuid AND (name = $name COLLATE NOCASE OR ${nameAvailable})`,
      )
      .run({
        uuid: survey,
        name: field(body.name, true),
        description: field(body.description),
      });
    if (
      !result.changes &&
      db.prepare("SELECT 1 FROM questionnaires WHERE uuid = ?").get(survey)
    )
      duplicateName();
    return changed(result);
  });
  route("DELETE", survey, ({ survey }) =>
    changed(
      db.prepare("DELETE FROM questionnaires WHERE uuid = ?").run(survey),
    ),
  );
  route(
    "POST",
    survey + "/responses",
    ({ survey }, { requestId, revision, answers }) => {
      if (
        typeof requestId !== "string" ||
        !requestId.length ||
        requestId.length > 64 ||
        typeof revision !== "string" ||
        !answers ||
        typeof answers !== "object" ||
        Array.isArray(answers)
      )
        fail(400, "form", "无效的表单");
      db.exec("BEGIN IMMEDIATE");
      try {
        const previous = db
          .prepare(
            "SELECT uuid, revision, answers FROM responses WHERE survey = ? AND request_id = ?",
          )
          .get(survey, requestId);
        if (previous) {
          if (
            previous.revision !== revision ||
            !isDeepStrictEqual(JSON.parse(previous.answers), answers)
          )
            fail(409, "submitted", "这份答卷已经提交");
          db.exec("COMMIT");
          return { uuid: previous.uuid };
        }
        const detail = surveyDetail(survey);
        if (detail.revision !== revision)
          fail(409, "changed", "问卷已修改，请刷新后重新填写");
        const questions = new Map(
          detail.modules.flatMap((m) => m.questions.map((q) => [q.uuid, q])),
        );
        const entries = Object.entries(answers);
        if (!entries.length) fail(400, "emptyAnswer", "请至少回答一道题");
        for (const [id, value] of entries) {
          const question = questions.get(id);
          if (!question || !validAnswer(question, value))
            fail(400, "answer", "请检查答案的题型和选项");
        }
        const uuid = randomUUID();
        db.prepare(
          "INSERT INTO responses (uuid, survey, request_id, revision, snapshot, answers) VALUES (?, ?, ?, ?, ?, ?)",
        ).run(
          uuid,
          survey,
          requestId,
          revision,
          JSON.stringify(detail),
          JSON.stringify(answers),
        );
        db.exec("COMMIT");
        return { uuid };
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  );
  route("POST", modules, (params, body) => {
    surveyRow(params.survey);
    const uuid = randomUUID();
    db.prepare("INSERT INTO modules VALUES (?, ?, ?)").run(
      uuid,
      params.survey,
      field(body.name, true),
    );
    return { uuid };
  });
  route("PUT", module, (p, body) =>
    changed(
      db
        .prepare("UPDATE modules SET name = ? WHERE uuid = ? AND survey = ?")
        .run(field(body.name, true), p.module, p.survey),
    ),
  );
  route("DELETE", module, (p) =>
    changed(
      db
        .prepare("DELETE FROM modules WHERE uuid = ? AND survey = ?")
        .run(p.module, p.survey),
    ),
  );
  route("POST", questions, (p, body) => {
    moduleRow(p);
    const uuid = randomUUID();
    db.prepare("INSERT INTO questions VALUES (?, ?, ?, ?, ?, ?)").run(
      uuid,
      p.module,
      ...questionFields(body),
    );
    return { uuid };
  });
  route("PUT", question, (p, body) => {
    moduleRow(p);
    return changed(
      db
        .prepare(
          "UPDATE questions SET type = ?, title = ?, description = ?, options = ? WHERE uuid = ? AND module = ?",
        )
        .run(...questionFields(body), p.question, p.module),
    );
  });
  route("DELETE", question, (p) => {
    moduleRow(p);
    return changed(
      db
        .prepare("DELETE FROM questions WHERE uuid = ? AND module = ?")
        .run(p.question, p.module),
    );
  });
  return routes;
}
