import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

export async function start(filename, t) {
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("../../dist/main.js", import.meta.url))],
    {
      env: {
        ...process.env,
        NODE_ENV: "test",
        HOST: "127.0.0.1",
        PORT: "0",
        QUESTIONNAIRE_DB: filename,
      },
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
  const exited = once(child, "exit");
  async function stop() {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await exited;
  }
  t.after(stop);
  const lines = createInterface({ input: child.stdout });
  for await (const line of lines) {
    const address = JSON.parse(line).msg?.match(
      /^Server listening at (http:\/\/\S+)$/,
    )?.[1];
    if (!address) continue;
    return {
      stop,
      async request(
        method,
        path,
        body,
        expectedStatus = method === "POST" ? 201 : 200,
        expectedErrorKey,
      ) {
        const res = await fetch(address + "/api/questionnaires" + path, {
          method,
          headers:
            body === undefined
              ? undefined
              : { "content-type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const json = await res.json();
        assert.equal(res.status, expectedStatus, JSON.stringify(json));
        assert.equal(json.success, expectedStatus < 400);
        if (expectedStatus >= 400)
          assert.match(json.errorKey, /^questionnaire:errors[.]/);
        if (expectedErrorKey) assert.equal(json.errorKey, expectedErrorKey);
        return json.data;
      },
    };
  }
  throw new Error("Questionnaire server exited before listening");
}
