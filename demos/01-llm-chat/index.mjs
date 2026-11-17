import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';

const apiKey = process.env.AGENT_API_KEY;
if (!apiKey) {
  console.error('请先设置环境变量 AGENT_API_KEY。');
  process.exit(1);
}

const response = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'deepseek-flash',
    messages: [{ role: 'user', content: '请写一篇约 500 字的中文短文，介绍上下文在大语言模型对话中的作用。直接输出正文。' }],
    stream: true,
  }),
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}

const lines = createInterface({ input: Readable.fromWeb(response.body), crlfDelay: Infinity });
for await (const line of lines) {
  if (!line.startsWith('data:')) continue;

  const data = line.slice(5).trim();
  if (data === '[DONE]') break;

  const chunk = JSON.parse(data);
  if (chunk.error) throw new Error(chunk.error.message);

  const text = chunk.choices[0]?.delta.content;
  if (text) process.stdout.write(text);
}
process.stdout.write('\n');
