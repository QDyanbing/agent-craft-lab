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
      for (const type of ["single", "multiple", "text", "number"]) {
        const options = ["single", "multiple"].includes(type)
          ? ["是", "否"]
          : [];
        const body = { type, title: type, description: "说明", options };
        const id = await request("POST", qs, body);
        saved.push({ uuid: id.uuid, ...body });
      }
      const original = await request("GET", survey);
      const answers = Object.fromEntries(
        saved.map((q, i) => [q.uuid, [0, [0, 1], "我的答案", 0][i]]),
      );
      const submission = {
        requestId: "first-attempt",
        revision: original.revision,
        answers,
      };
      const responses = survey + "/responses";
      for (const invalid of [
        {},
        { unknown: 1 },
        { [saved[0].uuid]: 2 },
        { [saved[1].uuid]: [0, 0] },
        { [saved[2].uuid]: " " },
        { [saved[3].uuid]: "0" },
      ]) {
        await request(
          "POST",
          responses,
          { ...submission, answers: invalid },
          400,
        );
      }
      const response = await request("POST", responses, submission);
      await first.stop();
      const editing = await start(db, t);
      request = editing.request;
      assert.deepEqual(await request("POST", responses, submission), response);
      await request(
        "POST",
        responses,
        { ...submission, answers: { [saved[3].uuid]: 1 } },
        409,
      );
      assert.deepEqual(
        (await request("GET", survey)).modules[0].questions,
        saved,
      );

      const sibling = await request("POST", survey + "/modules", {
        name: "另一个模块",
      });
      const siblingEntry = survey + "/modules/" + sibling.uuid;
      const wrongQuestion = siblingEntry + "/questions/" + saved[0].uuid;
      await request(
        "PUT",
        wrongQuestion,
        { type: "text", title: "跨模块修改" },
        404,
      );
      await request("DELETE", wrongQuestion, undefined, 404);
      await request("DELETE", siblingEntry);
      await request("POST", qs, { type: "file", title: "附件" }, 400);
      await request(
        "POST",
        qs,
        { type: "single", title: "无选项", options: [" "] },
        400,
      );
      await request(
        "DELETE",
        "/" + other.uuid + "/modules/" + module.uuid,
        undefined,
        404,
      );
      const edited = {
        ...saved[0],
        type: "multiple",
        title: "兴趣",
        description: "选择兴趣",
        options: ["阅读", "跑步", "音乐"],
      };
      await request("PUT", qs + "/" + edited.uuid, edited);
      await request(
        "POST",
        responses,
        { ...submission, requestId: "outdated-copy" },
        409,
      );
      saved[0] = edited;
      const converted = { ...saved[1], type: "text", title: "备注" };
      await request("PUT", qs + "/" + converted.uuid, converted);
      saved[1] = { ...converted, options: [] };
      await request("DELETE", qs + "/" + saved.pop().uuid);
      await editing.stop();

      const second = await start(db, t);
      const { revision, ...detail } = await second.request("GET", survey);
      assert.notEqual(revision, original.revision);
      assert.deepEqual(detail, {
        uuid,
        name: "调查",
        description: "学习情况",
        modules: [{ uuid: module.uuid, name: "基础信息", questions: saved }],
      });
      const list = await second.request("GET", "");
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
      await second.request("GET", "?pageNum=1", undefined, 400);
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
        (await second.request("GET", "")).find((item) => item.uuid === uuid)
          .questionCount,
        0,
      );
      await second.stop();
      const connection = new DatabaseSync(db, { readOnly: true });
      try {
        const rows = connection
          .prepare("SELECT uuid, snapshot, answers FROM responses")
          .all();
        assert.equal(rows.length, 1);
        assert.equal(rows[0].uuid, response.uuid);
        assert.deepEqual(JSON.parse(rows[0].answers), answers);
        assert.deepEqual(JSON.parse(rows[0].snapshot), original);
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
  assert.equal((await request("GET", "")).length, 1);
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
    (await request("GET", "?" + new URLSearchParams({ keyword: "%_ok" }))).map(
      (q) => q.uuid,
    ),
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
        type: "text",
        title: "意见",
      },
    );
    const original = await request("GET", path);
    await request("POST", path + "/responses", {
      requestId: "test",
      revision: original.revision,
      answers: { [question.uuid]: "很好" },
    });
    await request("PUT", path, { name: " ", description: "忽略" }, 400);
    assert.deepEqual(await request("GET", path), original);
    await request("PUT", path, { name: "新名称", description: "" });
    await server.stop();

    const reopened = await start(filename, t);
    const edited = await reopened.request("GET", path);
    assert.equal(edited.name, "新名称");
    assert.equal(edited.description, "");
    assert.deepEqual(edited.modules, original.modules);
    await reopened.request("DELETE", path);
    await reopened.request("GET", path, undefined, 404);
    await reopened.request("DELETE", path, undefined, 404);
    await reopened.request("PUT", path, { name: "已删除" }, 404);
    await reopened.stop();

    const db = new DatabaseSync(filename, { readOnly: true });
    try {
      assert.deepEqual(
        db
          .prepare("SELECT uuid FROM questionnaires")
          .all()
          .map((r) => r.uuid),
        [keep.uuid],
      );
      for (const table of ["modules", "questions", "responses"]) {
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
