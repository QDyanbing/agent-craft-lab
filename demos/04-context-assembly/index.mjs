/**
 * 演示工程侧怎样组织上下文：系统指令 + 历史消息 + 当前业务资料 + 用户问题。
 * 1. 只问权限审批是否符合要求：缺少评估规则和事实，模型需要补充资料。
 * 2. 应用补入审批规则和抽查记录：模型据此判断。
 * 3. 切换到离职账号控制项：保留对话历史，加入新的业务资料再追问。
 * 业务资料使用内置示例；每次打印完整请求，使用 SSE 输出真实模型响应。
 */
import { chat } from '../03-token-context/chat.mjs';

// 固定的任务要求放在 system，每次请求都携带。
const systemMessage = {
  role: 'system',
  content: '你是合规评估问卷助手。仅根据提供的评估规则和事实判断；资料不足时指出缺少的信息。当前控制项以最新的业务资料为准。用两句话给出结论和依据。',
};

// 模拟应用从业务接口取得的当前评估项，规则和事实均为演示数据。
const approvalContext = {
  systemName: '供应商管理系统',
  control: '特权账号开通审批',
  criterion: '每个特权账号须在开通前由系统负责人审批，并保留可追溯的审批记录。',
  evidence: '抽查 10 个特权账号，8 个在开通前完成审批，2 个在开通后补办审批。10 个账号均有审批记录。',
};

const departureContext = {
  systemName: '供应商管理系统',
  control: '离职账号停用',
  criterion: '员工离职当日停用账号，并保留停用记录。',
  evidence: '抽查 5 名离职员工，账号均在离职当日停用，5 条停用记录均可追溯。',
};

// 这条 user 消息由程序生成，不是用户在聊天框输入的。
// business_context 是便于识别资料的自定义标签，不是 API 的特殊字段。
function businessMessage(data) {
  return {
    role: 'user',
    content: `应用提供的当前业务资料：\n<business_context>\n${JSON.stringify(data, null, 2)}\n</business_context>`,
  };
}

const firstMessages = [
  systemMessage,
  { role: 'user', content: '这个系统的特权账号开通审批控制项符合要求吗？' },
];

const first = await chat('第一次请求：只有问题，缺少业务资料', firstMessages, 256);

// 保留上一轮对话，补入从应用取得的资料，再追加用户的新问题。
const secondMessages = [
  ...firstMessages,
  first.message,
  businessMessage(approvalContext),
  { role: 'user', content: '资料已补充，现在这个控制项符合要求吗？' },
];

const second = await chat('第二次请求：加入评估规则和抽查记录', secondMessages, 256);

// 用户切换了当前评估项：历史继续保留，应用把新评估项的资料加入本次输入。
const thirdMessages = [
  ...secondMessages,
  second.message,
  businessMessage(departureContext),
  { role: 'user', content: '那离职账号停用这一项呢？' },
];

await chat('第三次请求：保留历史，切换当前业务资料', thirdMessages, 256);

console.log('\n观察每次请求的 messages：除聊天记录外，还包含程序加入的任务要求和业务资料。');
