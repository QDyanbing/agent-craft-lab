import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { start } from "./support/server.js";

test(
  "questionnaire editing survives a process restart and respects module boundaries",
  { timeout: 30000 },
  async (t) => {
    const dir = await mkdtemp(join(tmpdir(), "craftlab-questionnaires-"));
    const db = join(dir, "test.sqlite");
    try {
      const first = await start(db, t);
      let request = first.request;
      await request("POST", "", { name: "  " }, 400);
      const { uuid } = await request("POST", "", {
        name: "调查",
        description: "学习情况",
      });
      const survey = "/" + uuid;
      const other = await request("POST", "", { name: "另一份问卷" });
      const module = await request("POST", survey + "/modules", {
        name: "课程",
      });
      const entry = survey + "/modules/" + module.uuid;
      await request("PUT", entry, { name: "基础信息" });
      const qs = entry + "/questions";
      const saved = [];
      for (const type of ["SINGLE", "MULTIPLE", "TEXT", "NUMBER"]) {
        const options = ["SINGLE", "MULTIPLE"].includes(type)
          ? ["是", "否"]
          : [];
        const body = { type, title: type, description: "说明", options };
        const id = await request("POST", qs, body);
        saved.push({ uuid: id.uuid, ...body });
      }
      const answers = Object.fromEntries(
        saved.map((q, i) => [q.uuid, [0, [0, 1], "我的答案", 0][i]]),
      );
      const responses = entry + "/questions/";
      const answer = (question, value, status = 201, errorKey) =>
        request(
          "POST",
          responses + question + "/answer",
          { answer: value },
          status,
          errorKey,
        );
      await answer(undefined, undefined, 400);
      await answer("unknown", 1, 404);
      await answer(saved[0].uuid, 2, 400);
      await answer(saved[1].uuid, [0, 0], 400);
      await answer(saved[2].uuid, " ", 400);
      await answer(saved[3].uuid, "0", 400);
      const answerIds = {};
      for (const question of saved) {
        const submitted = await answer(question.uuid, answers[question.uuid]);
        assert.equal(typeof submitted.uuid, "string");
        answerIds[question.uuid] = submitted.uuid;
      }
      assert.equal(new Set(Object.values(answerIds)).size, saved.length);
      assert.deepEqual(
        (await request("GET", survey)).modules[0].questions.map((question) => question.answer),
        saved.map((question) => answers[question.uuid]),
      );
      await first.stop();
      const editing = await start(db, t);
      request = editing.request;
      assert.deepEqual(
        (await request("GET", survey)).modules[0].questions.map((question) => question.answer),
        saved.map((question) => answers[question.uuid]),
      );
      for (const question of [...saved].reverse()) {
        assert.deepEqual(
          await answer(question.uuid, answers[question.uuid]),
          { uuid: answerIds[question.uuid] },
        );
      }
      assert.deepEqual(await answer(saved[3].uuid, 1), { uuid: answerIds[saved[3].uuid] });
      assert.deepEqual(
        await answer(saved[3].uuid, answers[saved[3].uuid]),
        { uuid: answerIds[saved[3].uuid] },
      );
      assert.deepEqual(
        (await request("GET", survey)).modules[0].questions,
        saved.map((question) => ({ ...question, answer: answers[question.uuid] })),
      );

      const clearable = saved.filter((question) => question.type !== "SINGLE");
      for (const question of clearable) {
        assert.equal(await answer(question.uuid, null), null);
      }
      await answer(saved[0].uuid, null, 400);
      assert.deepEqual((await request("GET", survey)).modules[0].questions, [
        { ...saved[0], answer: 0 },
        ...clearable,
      ]);
      assert.equal(await answer(saved[1].uuid, null), null);
      await answer(saved[0].uuid, undefined, 400);
      for (const question of clearable) {
        await answer(question.uuid, answers[question.uuid]);
      }

      const sibling = await request("POST", survey + "/modules", {
        name: "另一个模块",
      });
      const siblingEntry = survey + "/modules/" + sibling.uuid;
      const wrongQuestion = siblingEntry + "/questions/" + saved[0].uuid;
      await request(
        "PUT",
        wrongQuestion,
        { type: "TEXT", title: "跨模块修改" },
        404,
      );
      await request("DELETE", wrongQuestion, undefined, 404);
      await request("DELETE", siblingEntry);
      await request("POST", qs, { type: "file", title: "附件" }, 400);
      await request(
        "POST",
        qs,
        { type: "SINGLE", title: "无选项", options: [" "] },
        400,
        "questionnaire:errors.options",
      );
      await request(
        "DELETE",
        "/" + other.uuid + "/modules/" + module.uuid,
        undefined,
        404,
      );
      const edited = {
        ...saved[0],
        type: "MULTIPLE",
        title: "兴趣",
        description: "选择兴趣",
        options: ["阅读", "跑步", "音乐"],
      };
      await request("PUT", qs + "/" + edited.uuid, edited);
      saved[0] = edited;
      delete answers[edited.uuid];
      const converted = { ...saved[1], type: "TEXT", title: "备注" };
      await request("PUT", qs + "/" + converted.uuid, converted);
      saved[1] = { ...converted, options: [] };
      delete answers[converted.uuid];
      const removed = saved.pop();
      await request("DELETE", qs + "/" + removed.uuid);
      delete answers[removed.uuid];
      await editing.stop();

      const second = await start(db, t);
      assert.deepEqual(await second.request("GET", survey), {
        uuid,
        name: "调查",
        description: "学习情况",
        modules: [
          {
            uuid: module.uuid,
            name: "基础信息",
            questions: saved.map((question) =>
              Object.hasOwn(answers, question.uuid)
                ? { ...question, answer: answers[question.uuid] }
                : question,
            ),
          },
        ],
      });
      await second.request("GET", "", undefined, 400);
      const { list } = await second.request("GET", "?pageNum=1&pageSize=10");
      assert.equal(list.length, 2);
      assert.deepEqual(await second.request("GET", "?pageNum=1&pageSize=1"), {
        list: [list[0]],
        total: 2,
      });
      assert.deepEqual(await second.request("GET", "?pageNum=2&pageSize=1"), {
        list: [list[1]],
        total: 2,
      });
      assert.deepEqual(await second.request("GET", "?pageNum=3&pageSize=1"), {
        list: [],
        total: 2,
      });
      assert.equal(list[0].description, "");
      await second.request("GET", "?pageNum=0&pageSize=1", undefined, 400);
      assert.deepEqual(await second.request("GET", "?pageNum=1"), { list, total: 2 });
      assert.deepEqual(
        list.find((item) => item.uuid === uuid),
        {
          uuid,
          name: "调查",
          description: "学习情况",
          moduleCount: 1,
          questionCount: 3,
        },
      );
      await second.request("DELETE", entry);
      assert.deepEqual((await second.request("GET", survey)).modules, []);
      await second.request("PUT", qs + "/" + edited.uuid, edited, 404);
      assert.equal(
        (await second.request("GET", "?pageNum=1&pageSize=10")).list.find(
          (item) => item.uuid === uuid,
        )
          .questionCount,
        0,
      );
      await second.stop();
      const connection = new DatabaseSync(db, { readOnly: true });
      try {
        assert.equal(
          connection.prepare("SELECT count(*) AS count FROM craft_lab_answer").get().count,
          0,
        );
      } finally {
        connection.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);

test("duplicate questionnaire names are rejected on create and rename", async (t) => {
  const { request } = await start(":memory:", t);
  const duplicate = "questionnaire:errors.duplicateName";
  const first = await request("POST", "", { name: "  反馈 A  " });
  await request("POST", "", { name: "反馈 a" }, 409, duplicate);
  const second = await request("POST", "", {
    name: "另一份",
    description: "原描述",
  });
  await request(
    "PUT",
    "/" + second.uuid,
    { name: " 反馈 A", description: "不应保存" },
    409,
    duplicate,
  );
  const detail = await request("GET", "/" + second.uuid);
  assert.equal(detail.name, "另一份");
  assert.equal(detail.description, "原描述");
  await request("PUT", "/" + first.uuid, {
    name: "反馈 A",
    description: "新描述",
  });
  assert.equal((await request("GET", "/" + first.uuid)).description, "新描述");
  await request("DELETE", "/" + first.uuid);
  await request("PUT", "/" + second.uuid, { name: "反馈 A" });
  assert.equal((await request("GET", "?pageNum=1&pageSize=10")).total, 1);
});

test("keyword search counts matching surveys before pagination", async (t) => {
  const { request } = await start(":memory:", t);
  const byName = await request("POST", "", { name: "课程反馈 A" });
  await request("POST", "", { name: "其他问卷" });
  const byDescription = await request("POST", "", {
    name: "B",
    description: "课程反馈 100%_OK",
  });
  const search = (keyword, pageNum) =>
    request(
      "GET",
      "?" +
        new URLSearchParams({
          keyword,
          pageNum: String(pageNum),
          pageSize: "1",
        }),
    );

  const first = await search(" 课程反馈 ", 1);
  assert.equal(first.total, 2);
  assert.deepEqual(
    first.list.map((q) => q.uuid),
    [byDescription.uuid],
  );
  const second = await search("课程反馈", 2);
  assert.equal(second.total, 2);
  assert.deepEqual(
    second.list.map((q) => q.uuid),
    [byName.uuid],
  );
  assert.deepEqual(await search("课程反馈", 3), { list: [], total: 2 });
  assert.deepEqual(await search("不存在", 1), { list: [], total: 0 });
  assert.equal((await search("", 1)).total, 3);
  assert.deepEqual(
    (
      await request(
        "GET",
        "?" +
          new URLSearchParams({ keyword: "%_ok", pageNum: "1", pageSize: "10" }),
      )
    ).list.map((q) => q.uuid),
    [byDescription.uuid],
  );
});

test("editing and deleting a questionnaire persists and affects only that survey", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "craftlab-survey-actions-"));
  const filename = join(dir, "test.sqlite");
  try {
    const server = await start(filename, t);
    const { request } = server;
    const keep = await request("POST", "", { name: "保留" });
    const { uuid } = await request("POST", "", {
      name: "原名称",
      description: "旧描述",
    });
    const path = "/" + uuid;
    const module = await request("POST", path + "/modules", { name: "模块" });
    const question = await request(
      "POST",
      path + "/modules/" + module.uuid + "/questions",
      {
        type: "TEXT",
        title: "意见",
      },
    );
    const original = await request("GET", path);
    await request(
      "POST",
      path + "/modules/" + module.uuid + "/questions/" + question.uuid + "/answer",
      {
        answer: "很好",
      },
    );
    const answered = structuredClone(original);
    answered.modules[0].questions[0].answer = "很好";
    await request("PUT", path, { name: " ", description: "忽略" }, 400);
    assert.deepEqual(await request("GET", path), answered);
    await request("PUT", path, { name: "新名称", description: "" });
    await server.stop();

    const reopened = await start(filename, t);
    const edited = await reopened.request("GET", path);
    assert.equal(edited.name, "新名称");
    assert.equal(edited.description, "");
    assert.deepEqual(edited.modules, answered.modules);
    await reopened.request("DELETE", path);
    await reopened.request("GET", path, undefined, 404);
    await reopened.request("DELETE", path, undefined, 404);
    await reopened.request("PUT", path, { name: "已删除" }, 404);
    await reopened.stop();

    const db = new DatabaseSync(filename, { readOnly: true });
    try {
      assert.deepEqual(
        db
          .prepare("SELECT uuid FROM craft_lab_questionnaires")
          .all()
          .map((r) => r.uuid),
        [keep.uuid],
      );
      for (const table of ["craft_lab_modules", "craft_lab_questions", "craft_lab_answer"]) {
        assert.equal(
          db.prepare(`SELECT count(*) AS count FROM ${table}`).get().count,
          0,
        );
      }
    } finally {
      db.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
