import { chat } from './chat.mjs';

const timeTool = {
  type: 'function',
  function: {
    name: 'get_current_time',
    description: '查询指定时区的当前日期和时间。',
    parameters: {
      type: 'object',
      properties: {
        timeZone: { type: 'string', description: 'IANA 时区，例如 Asia/Shanghai' },
      },
      required: ['timeZone'],
    },
  },
};

function getCurrentTime(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone) throw new Error('缺少时区参数');
  const time = new Intl.DateTimeFormat('zh-CN', {
    timeZone, dateStyle: 'short', timeStyle: 'medium',
  }).format(new Date());
  return { timeZone, time };
}

function executeTool(call) {
  if (call.function.name !== timeTool.function.name) throw new Error(`未知工具：${call.function.name}`);
  const { timeZone } = JSON.parse(call.function.arguments);
  const result = getCurrentTime(timeZone);
  console.log('程序执行工具', call.function.name, '返回', result);

  return { role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) };
}

let requestNumber = 0;

async function answer(messages) {
  // 每次请求都声明可用工具。模型可以直接回答，也可以返回一个或多个 tool_calls。
  const reply = await chat(`请求 ${++requestNumber}`, {
    messages,
    tools: [timeTool],
    tool_choice: 'auto',
  });
  const history = [...messages, reply];
  if (!reply.tool_calls?.length) return history;

  // 每个工具结果用 tool_call_id 对应到原调用，带上完整历史再交给模型决定下一步。
  const results = reply.tool_calls.map(executeTool);
  return answer([...history, ...results]);
}

console.log('第一次提问');
const firstTurn = await answer([
  { role: 'user', content: '请查询上海现在的时间，用一句中文回答，精确到秒。' },
]);

console.log('第二次提问');
await answer([
  ...firstTurn,
  { role: 'user', content: '再查一下东京现在的时间，并告诉我刚才查询上海时用的是哪个 IANA 时区。' },
]);
