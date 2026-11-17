import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';

const apiKey = process.env.AGENT_API_KEY;
if (!apiKey) {
  console.error('请先设置环境变量 AGENT_API_KEY。');
  process.exit(1);
}

export async function chat(step, request) {
  const body = JSON.stringify({
    model: 'deepseek-flash',
    thinking: { type: 'disabled' },
    stream: true,
    ...request,
  }, null, 2);

  console.log(`\n${step}\n${body}`);
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

  process.stdout.write('模型返回 ');
  return readMessage(response.body);
}

async function readMessage(body) {
  const input = Readable.fromWeb(body);
  const lines = createInterface({ input, crlfDelay: Infinity });
  const message = { role: 'assistant', content: '' };

  try {
    return await new Promise((resolve, reject) => {
      lines.on('error', reject);
      lines.on('close', () => reject(new Error('模型响应流意外中断')));
      lines.on('line', (line) => {
        if (!line.startsWith('data:')) return;
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          resolve(message);
          return;
        }

        try {
          const chunk = JSON.parse(data);
          if (chunk.error) throw new Error(chunk.error.message);
          const delta = chunk.choices[0]?.delta;
          if (delta?.content) {
            message.content += delta.content;
            process.stdout.write(delta.content);
          }

          // 同一批工具调用可能交错到达。index 相同的片段属于同一次调用。
          delta?.tool_calls?.forEach((part) => {
            message.tool_calls ??= [];
            const call = message.tool_calls[part.index] ??= {
              type: 'function',
              function: { name: '', arguments: '' },
            };
            if (part.id) call.id = part.id;
            const name = part.function?.name ?? '';
            const args = part.function?.arguments ?? '';
            call.function.name += name;
            call.function.arguments += args;
            process.stdout.write(name + args);
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  } finally {
    lines.close();
    input.destroy();
    process.stdout.write('\n');
  }
}
