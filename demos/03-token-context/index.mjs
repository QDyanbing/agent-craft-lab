/**
 * 演示 Token 统计、历史对上下文的占用，以及输出长度限制。
 * 1. 短问题：观察 API 返回的输入、输出和总 Token 数。
 * 2. 带上历史继续提问：观察输入 Token 如何增长。
 * 3. 重复第二次请求，仅降低 max_tokens：观察输出被截断。
 * Token 不等于字数，统计以 usage 为准；每次都打印完整请求并使用 SSE。
 * 上下文窗口限制输入与输出的总量；max_tokens 只限制本次输出。
 */
import { chat } from './chat.mjs';

const firstMessages = [
  { role: 'system', content: '用中文回答，直接解释概念。' },
  { role: 'user', content: '用一句话解释什么是 Token。' },
];

const first = await chat('第一次请求：短问题，查看真实 Token 用量', firstMessages, 256);

// 上一轮的用户消息和模型回复都会成为本轮输入，占用上下文空间。
const secondMessages = [
  ...firstMessages,
  first.message,
  { role: 'user', content: '本例每次携带完整聊天记录。请用约 200 字解释：历史增长为什么会增加输入 Token？' },
];

const second = await chat('第二次请求：携带历史继续提问', secondMessages, 512);

// 使用完全相同的输入比较输出上限；16 Token 不足以完成上面的 200 字回答。
const limited = await chat('第三次请求：相同输入，输出上限降到 16 Token', secondMessages, 16);

console.log('\n三次请求的实际统计：');
console.table([
  {
    请求: '第一次：短问题',
    输入: first.usage.prompt_tokens,
    输出: first.usage.completion_tokens,
    总计: first.usage.total_tokens,
    输出上限: 256,
    结束原因: first.finishReason,
  },
  {
    请求: '第二次：带历史',
    输入: second.usage.prompt_tokens,
    输出: second.usage.completion_tokens,
    总计: second.usage.total_tokens,
    输出上限: 512,
    结束原因: second.finishReason,
  },
  {
    请求: '第三次：相同输入，限制输出',
    输入: limited.usage.prompt_tokens,
    输出: limited.usage.completion_tokens,
    总计: limited.usage.total_tokens,
    输出上限: 16,
    结束原因: limited.finishReason,
  },
]);

console.log('prompt_tokens：输入占用，包含系统指令和本次携带的全部消息。');
console.log('completion_tokens：本次生成的 Token；total_tokens：输入与输出之和。');
console.log('stop 表示自然结束；length 表示达到长度限制，本例第三次请求限制了输出。');
console.log('max_tokens 不会缩小模型的上下文窗口；本例观察历史占用，没有填满模型窗口。');
