import { Buffer } from 'node:buffer';

/** deepseek-flash 的 context_window，见 https://api-docs.deepseek.com/api/list-models/ */
const windowTokens = 1_048_576;
/** 项目配置：按当前 demo 最长的审查请求预留输出空间。 */
const reservedOutputTokens = 1_024;
/** 项目配置：为消息封装和估算误差预留 256 tokens。 */
const safetyTokens = 256;
/** 本项目用扣除预留后的输入预算作百分比分母。 */
const inputLimit = windowTokens - reservedOutputTokens - safetyTokens;
/**
 * 参考 Claude Code 的 CLAUDE_AUTOCOMPACT_PCT_OVERRIDE：https://code.claude.com/docs/en/env-vars
 * 借鉴按比例触发的方式；80% 和向上取整均为本项目选择。
 */
const compactThreshold = Math.ceil(inputLimit * 0.8);

interface TextMessage {
  role: string;
  content: string;
}

/**
 * 参考 Codex 的 approx_token_count，对每条新增消息的正文估算后累加。
 * https://github.com/openai/codex/blob/0c5ccd18abda96efaed9e94e26ffe22def5e28ed/codex-rs/utils/string/src/truncate.rs#L71-L74
 */
function estimateAddedTokens(messages: readonly TextMessage[]): number {
  let addedTokens = 0;
  for (const message of messages) {
    /** 取输入正文的 UTF-8 字节数。 */
    const bytes = Buffer.byteLength(message.content, 'utf8');
    /** 参考 Codex：每 4 字节估算 1 个 token，余数向上取整。 */
    addedTokens += Math.ceil(bytes / 4);
  }
  return addedTokens;
}

/** 采用百分比触发方案，阈值由上方 compactThreshold 预先算出。 */
export function shouldCompact(previousTokens: number, appendedMessages: readonly TextMessage[]): boolean {
  if (!Number.isSafeInteger(previousTokens) || previousTokens < 0) {
    throw new RangeError('previousTokens must be a non-negative safe integer');
  }
  /** 已保留的上一轮用量只加本轮新增消息。 */
  const totalTokens = previousTokens + estimateAddedTokens(appendedMessages);
  /** 本项目的触发边界：追加后总量达到 837,837 tokens 即返回 true。 */
  return totalTokens >= compactThreshold;
}
