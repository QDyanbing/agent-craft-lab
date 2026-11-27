/**
 * 演示结构化输出：JSON 能解析，不代表字段符合约定，也不代表结论正确。
 * 1. 第一次只在提示词中要求 JSON，解析并检查实际返回值。
 * 2. 第二次携带完整历史、补充证据，并通过 response_format 开启 JSON 模式。
 * 3. 用固定反例观察：合法 JSON 也会被字段校验拒绝。
 * 两次请求均使用 SSE，打印完整请求；业务规则和资料均为教学示例。
 */
import { chat } from '../03-token-context/chat.mjs';

// 只校验本例的三个字段，不是通用 JSON Schema 校验器，也不验证业务事实。
function validateResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('结果必须是对象');
  }
  const keys = Object.keys(value).sort();
  if (JSON.stringify(keys) !== JSON.stringify(['evidence', 'reason', 'status'])) {
    throw new Error('只能包含 status、evidence、reason 三个字段，且不能缺少');
  }
  if (!['pass', 'fail', 'unknown'].includes(value.status)) {
    throw new Error('status 必须是 pass、fail 或 unknown');
  }
  if (!Array.isArray(value.evidence) || !value.evidence.every((item) => typeof item === 'string')) {
    throw new Error('evidence 必须是字符串数组');
  }
  if (typeof value.reason !== 'string') throw new Error('reason 必须是字符串');
  return value;
}

function inspectResult(label, response) {
  try {
    // chat 已把 SSE 片段拼接完；不能对每个片段直接执行 JSON.parse。
    if (response.finishReason !== 'stop' || !response.message.content.trim()) {
      throw new Error('输出未完整结束或内容为空');
    }
    const value = JSON.parse(response.message.content);
    console.log(`\n${label}：JSON.parse 成功`, value);
    validateResult(value);
    console.log('字段校验通过；事实与判断仍需根据证据核对。');
  } catch (error) {
    console.log(`\n${label}：程序拒绝采用这份结果：${error.message}`);
  }
}

const systemMessage = {
  role: 'system',
  content: `你是合规评估助手，只依据用户提供的示例规则和证据判断，不引用其他法规。
只输出 JSON 对象，不要 Markdown 代码块或额外文字。
固定三个字段：status 只能为 pass、fail、unknown；evidence 是本次判断引用的证据编号数组；reason 是简短中文说明。
pass 表示证据支持符合要求，fail 表示证据已确认违反要求，unknown 表示证据不足。
缺少证据不能直接判 fail，不能编造证据编号。
格式示例：{"status":"unknown","evidence":[],"reason":"缺少支持判断的证据。"}`,
};

const firstMessages = [
  systemMessage,
  {
    role: 'user',
    content: '评估供应商管理系统的离职账号停用控制。示例规则：员工离职当日必须停用其全部后台管理账号，并保留日志。现有资料：管理员口头称已全部当日停用，尚未提供逐账号日志。请给出评估结果。',
  },
];

// 只靠提示词：本次可能恰好输出正确 JSON，不能据此认为每次都有保证。
const first = await chat('第一次请求：只在提示词中要求 JSON', firstMessages, 512);
inspectResult('第一次返回', first);

const secondMessages = [
  ...firstMessages,
  first.message,
  {
    role: 'user',
    content: '补充原始停用日志 D-02：7 个账号中，5 个在离职当日停用，ADM006、ADM007 在次日停用。请根据新证据更新评估结果，仍按相同 JSON 结构返回。',
  },
];

// JSON 模式约束 JSON 格式；字段约定仍由提示词说明、本地代码检查。
const second = await chat('第二次请求：携带历史并开启 JSON 模式', secondMessages, 512, {
  type: 'json_object',
});
inspectResult('第二次返回', second);

// 固定反例，不是模型的实际返回：把数组写成字符串，JSON 语法仍然合法。
const invalid = JSON.parse('{"status":"fail","evidence":"D-02","reason":"存在次日停用账号。"}');
console.log('\n固定反例（非模型返回）：JSON.parse 成功', invalid);
try {
  validateResult(invalid);
} catch (error) {
  console.log('字段校验拒绝：', error.message);
}

console.log('\n请求参数决定是否开启 JSON 模式；能解析、字段正确、事实正确，是三个不同检查。');
console.log('两次都可能返回合规格式；本例未使用服务端 JSON Schema 约束。');
