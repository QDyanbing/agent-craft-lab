/**
 * 演示提示缓存：相同前缀复用计算，改动开头会影响后续内容的缓存匹配。
 * 1. 发送评估资料，询问账号开通审批是否符合要求。
 * 2. 保留完整历史，追加离职账号停用问题，观察缓存命中 Token。
 * 3. 仅改写开头的 system 消息，重发第二次请求，比较命中量。
 * 每次打印完整请求和真实 usage，使用 SSE 输出；缓存由 DeepSeek 自动管理。
 */
import { setTimeout } from 'node:timers/promises';
import { chat } from '../03-token-context/chat.mjs';

const systemMessage = {
  role: 'system',
  content: '你是合规评估助手。仅根据提供的评估规则和记录判断，用中文给出结论和依据，每次回答不超过 100 字。',
};

// 固定的业务资料放在问题之前；规则和记录均为教学示例。
const assessment = `供应商管理系统：账号与权限控制评估资料

评估范围：本次只检查后台管理账号，不涉及供应商门户账号。证据包括账号清单、审批工单、离职名单和权限复核记录。

控制项一：特权账号开通审批
规则：每个特权账号须在开通前完成系统负责人审批，并保留包含申请人、审批人、审批时间和开通时间的记录。
记录：抽查 10 个账号。ADM001 至 ADM008 均在开通前审批；ADM009 和 ADM010 在开通后补办审批。10 个账号都保留了完整工单，可核对审批与开通的先后顺序。
说明：保留了审批记录，并不代表审批发生在开通之前；判断时需要同时核对两个时间。

控制项二：离职账号停用
规则：员工离职当日停用其后台管理账号，并保留人员、离职日期、关联账号和停用时间的记录。
记录：抽查 5 名离职员工，共关联 7 个后台管理账号。全部账号均在相应员工离职当日停用，7 条停用记录均可追溯，人员名单与账号清单能够对应。
说明：员工人数和账号数量不同，因为部分员工持有多个账号；应按全部关联账号判断，不能只检查每人的一个账号。

控制项三：特权账号定期复核
规则：每季度复核特权账号的使用人、岗位和权限，并保留复核结论。
记录：本季度抽查上述 10 个账号，其中 8 个有完整复核记录，另 2 个仅由管理员口头说明已检查，没有提供记录。
说明：口头说明可作为待核实线索，不能替代本例规则要求保留的复核记录。`;

const firstMessages = [
  systemMessage,
  { role: 'user', content: `${assessment}\n\n问题：特权账号开通审批是否符合本例要求？` },
];

const first = await chat('第一次请求：发送资料并询问开通审批', firstMessages, 256);

// 官方说明缓存构建需要数秒；暂停仅用于留出写入时间，不保证命中。
console.log('\n留出 5 秒供服务端构建缓存，再发送追问。');
await setTimeout(5000);

// 缓存不会替我们保存对话：仍然发送完整历史，开头的消息保持原样。
const secondMessages = [
  ...firstMessages,
  first.message,
  { role: 'user', content: '离职账号停用这一项是否符合本例要求？' },
];

const second = await chat('第二次请求：保留前缀，携带历史追问', secondMessages, 256);

// 对照重发第二次请求，仅替换第一条消息；不是追加第三轮聊天。
// 含义接近不等于前缀相同，后面的资料和历史没有改动。
const thirdMessages = [
  {
    role: 'system',
    content: '请作为合规评估助手，仅依据所给评估规则和记录，用不超过 100 字的中文回答结论和依据。',
  },
  ...secondMessages.slice(1),
];

const third = await chat('第三次请求：改写开头，重发同一个追问', thirdMessages, 256);

// 只展示接口返回的统计，不按消息长度推算，也不把未命中当成代码错误。
function cacheRow(step, { usage }) {
  return {
    请求: step,
    输入: usage.prompt_tokens,
    缓存命中: usage.prompt_cache_hit_tokens,
    未命中: usage.prompt_cache_miss_tokens,
    输出: usage.completion_tokens,
  };
}

console.log('\n三次请求的实际缓存统计：');
console.table([
  cacheRow('首次提问', first),
  cacheRow('保留前缀并追问', second),
  cacheRow('改写开头后重发', third),
]);
console.log('输入 Token = 缓存命中 + 未命中；命中的 Token 仍然属于本次上下文。');
console.log('重复运行可能让首次请求也命中；缓存命中量以 usage 为准，回复每次重新生成。');
