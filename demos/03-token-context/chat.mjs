import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';

const apiKey = process.env.AGENT_API_KEY;
if (!apiKey) {
  console.error('请先设置环境变量 AGENT_API_KEY。');
  process.exit(1);
}

export async function chat(step, messages, maxTokens, responseFormat) {
  const body = JSON.stringify({
    model: 'deepseek-flash',
    thinking: { type: 'disabled' },
    messages,
    stream: true,
    // 在 SSE 响应中获取服务端统计，不按字符数或流式片段数估算 Token。
    stream_options: { include_usage: true },
    max_tokens: maxTokens,
    response_format: responseFormat,
  }, null, 2);

  console.log(`\n${step}\n${body}`);
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

  process.stdout.write('模型返回 ');
  const result = await readMessage(response.body);
  console.log('API 返回的 usage：', JSON.stringify(result.usage, null, 2));
  console.log('finish_reason：', result.finishReason);
  return result;
}

async function readMessage(body) {
  const input = Readable.fromWeb(body);
  const lines = createInterface({ input, crlfDelay: Infinity });
  const message = { role: 'assistant', content: '' };
  let usage;
  let finishReason;

  try {
    return await new Promise((resolve, reject) => {
      lines.on('error', reject);
      lines.on('close', () => reject(new Error('模型响应流意外中断')));
      lines.on('line', (line) => {
        if (!line.startsWith('data:')) return;
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          resolve({ message, usage, finishReason });
          return;
        }

        try {
          const chunk = JSON.parse(data);
          if (chunk.error) throw new Error(chunk.error.message);

          // usage 在末尾返回；即使当前片段没有正文，也要读取统计和结束原因。
          if (chunk.usage) usage = chunk.usage;
          const choice = chunk.choices[0];
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          if (choice?.delta.content) {
            message.content += choice.delta.content;
            process.stdout.write(choice.delta.content);
          }
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
