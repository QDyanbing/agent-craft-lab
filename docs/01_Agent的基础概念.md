## 在人工智能领域 Agent 是什么

**定义：**是指能够感知环境、根据目标自主选择行动，并通过行动影响环境的系统。

**本质：**LLM（大语言模型） + Tool（工具） + Context（上下文）

## LLM（大语言模型）是啥，在 Agent 开发中的作用是啥

**LLM（Large Language Model，大语言模型）**是一类通过大量数据训练、能够处理和生成语言的模型。它的基本工作方式是根据上下文预测下一个 token（文本片段），逐步生成输出。

在基于 LLM 的 Agent 中，LLM 负责根据目标和上下文决定下一步。它可以生成回复，也可以选择要调用的工具并给出参数。Agent 程序负责执行工具调用，把结果放回上下文，再由 LLM 判断是否需要继续。

**本质：**推理与决策的大脑

## Tool（工具）是啥，在 Agent 开发中的作用是啥

**Tool（工具）**是 Agent 可以调用的能力。它通过明确的接口规定能做什么、需要哪些参数，以及调用后会返回什么结果。

在 Agent 开发中，工具的作用是让 Agent 能够获取外部信息或执行操作。LLM 根据目标和上下文选择工具并生成参数，Agent 的运行程序执行调用，再把结果作为上下文交给 LLM，供它决定下一步。

**本质：**工具是对 LLM 自身能力的扩展，它既能补充模型本身不具备的能力，也能让模型借助外部程序，更可靠地完成原本就能处理的任务；

## Context（上下文）是啥，在 Agent 开发中的作用是啥

**Context（上下文）**是 Agent 在某一次调用 LLM 时，模型能看到的全部信息，通常包括任务目标、指令、相关对话、可用工具的说明，以及之前的工具调用结果。

在 Agent 开发中，上下文为模型决定下一步提供依据。Agent 程序在每次调用前，把当前任务所需的信息组织成上下文，让模型知道要做什么、有哪些约束、已经得到什么结果。历史记录或长期记忆只有被纳入本次上下文，才能直接参与这次判断。

**本质：**本次调用给模型的全部输入，聊天记录只是其中一部分。

## 综上总结

- Agent 开发的本质就是给 LLM 整理上下文的过程；

## 通信时如何将上下文发送给 LLM

**本质就是一次 HTTP 请求。** 程序把对话按顺序放进请求体。以用户说“你好”为例，各家接口的消息部分写法如下。

| 接口                                                | 请求体中的消息                                             |
| --------------------------------------------------- | ---------------------------------------------------------- |
| DeepSeek / OpenAI Chat Completions、Claude Messages | `{"messages":[{"role":"user","content":"你好"}]}`          |
| OpenAI Responses                                    | `{"input":[{"role":"user","content":"你好"}]}`             |
| Gemini generateContent                              | `{"contents":[{"role":"user","parts":[{"text":"你好"}]}]}` |

## role 是什么

`role` 标明一条消息的来源，取值由接口规定。前文四家服务的消息角色按含义列在下面。

- **用户**　`user`（DeepSeek、OpenAI、Claude、Gemini）。
- **模型回复**　`assistant`（DeepSeek、OpenAI、Claude），`model`（Gemini）。
- **系统指令**　`system`（DeepSeek、OpenAI）。Claude 的初始指令放在顶层 `system` 字段，支持会话中途更新指令的 Claude 模型也接受 `role: "system"`。Gemini 用顶层 `systemInstruction` 字段。
- **开发者指令**　`developer`（OpenAI Chat Completions、OpenAI Responses）。DeepSeek Responses 也接受此角色，但会按模型映射为其他角色，见下文指令层级。
- **工具执行结果**　`tool`（DeepSeek、OpenAI Chat Completions）。Claude 用 `user` 消息携带 `tool_result` 内容块，Gemini 用 `user` 消息携带 `functionResponse`。OpenAI Responses 的函数结果用 `type: "function_call_output"`。
- **旧版函数执行结果**　`function`（OpenAI Chat Completions，已弃用）。旧版 Gemini SDK 的函数结果消息也使用过 `function`。
- **用户环境信息**　`latest_reminder`（DeepSeek），放在对应 `user` 消息之前，可携带日期、星期、地点、平台和语言。

**必须传吗？** 本项目用的 DeepSeek Chat Completions 要求每条消息都写 `role`，但一次请求只发一条 `user` 消息就够了。其他接口按各自格式约定：

- OpenAI Chat Completions 和 Claude Messages 的 `messages` 消息对象也需要 `role`。
- OpenAI Responses 可以直接传 `{"input":"你好"}`，等同于用户输入。传消息对象时要写 `role`。
- Gemini 的 `contents[].role` 可省略。多轮对话建议用 `user` 和 `model` 标清双方发言。

## Token（词元）是什么

Token 是模型读取和生成文本的基本单位，由分词器划分。一个字或单词可能对应一个或多个 Token，具体取决于分词器。

**本质：**模型处理文本的计量单位，不等于字数。

当前 demo 使用 DeepSeek Chat Completions 返回的 `usage` 统计实际用量：

- `prompt_tokens`：本次输入的 Token 数，包含系统指令、工具定义、历史和当前消息等。
- `completion_tokens`：本次生成的 Token 数。
- `total_tokens`：输入与输出 Token 数之和。

## Context Window（上下文窗口）是什么

上下文窗口是模型单次调用可容纳的 Token 容量，输入和输出共同占用。

例如窗口为 10,000 Token，输入占用 8,000 Token，就剩下 2,000 Token 空间用于输出；实际输出还受模型输出上限和请求参数限制。

`max_tokens` 设置本次输出的 Token 上限，不改变上下文窗口大小，也不代表一定生成这么多 Token。

**本质：**一次调用能容纳多少内容。每次携带完整历史时，历史增长会增加输入占用；筛选或压缩上下文可以减少这部分占用。

常用模型的上下文窗口（2026-11-24 核对官方 API 规格；单位为 Token，1M 约为 100 万，保留官方标注）：

| 厂商 | 模型 | 上下文窗口 |
| --- | --- | --- |
| OpenAI | [GPT-6.2 Astra](https://developers.openai.com/api/docs/models/gpt-6.2-astra)、[GPT-6.2 Sol](https://developers.openai.com/api/docs/models/gpt-6.2-sol) | 1,050,000 |
| Anthropic | [Claude Fable 5.2](https://platform.claude.com/docs/en/models/overview) | 1M |
| Anthropic | [Claude Opus 5.5 / Sonnet 5.5 / Haiku 5.5](https://platform.claude.com/docs/en/models/overview) | 1M |
| Google | [Gemini 4 Hydrogen](https://aistudio.google.com/docs/models/gemini-4-hydrogen) | 1,048,576 |
| DeepSeek | [deepseek-flash、deepseek-v4-pro](https://api-docs.deepseek.com/quick_start/pricing/) | 1M |

上下文窗口不等于最大输入量。例如 GPT-6.2 Astra / Sol 的窗口为 1,050,000 Token，但输入上限为 922,000，输出上限为 128,000。

## 上下文组织是什么

每次调用模型前，工程侧选择本次任务需要的信息，组合成请求。业务资料需要放进请求，模型才能在本次回答中使用。

| 信息 | 来源 | 当前 demo 中的位置 |
| --- | --- | --- |
| 任务要求 | 程序配置 | `system` 消息 |
| 对话历史 | 前面的用户消息和模型回复 | 按原顺序保留在 `messages` 中 |
| 当前业务资料 | 业务接口、数据库等；demo 使用内置示例 | 程序生成的 `user` 消息 |
| 当前问题 | 用户输入 | 最后一条 `user` 消息 |

`user` 是消息角色，不代表内容一定由用户在聊天框手动输入。demo 用 `<business_context>` 标记业务资料，这是自定义文本标签，不是 API 的特殊字段。

需要工具时，工具定义放在请求的 `tools` 字段，调用结果再按接口格式加入后续上下文。

**本质：**决定本次给模型什么信息，以及如何组合。例如询问某个控制项是否符合要求，需要同时提供该控制项的评估规则和实际证据。

## 指令层级（Instruction Hierarchy）是什么

指令层级规定：上下文中的要求发生冲突时，模型应该听谁的。

各厂商的约定不同（2026-11-25 核对）：

| 厂商 | 官方说明的指令关系 | 接口中怎么传 |
| --- | --- | --- |
| [OpenAI](https://model-spec.openai.com/2026-10-29.html#follow-all-applicable-instructions) | `Root > system > developer > user > guideline`。同层级冲突时，后续要求覆盖此前要求。 | 消息用 `role: "system"`、`"developer"`、`"user"`。 |
| [Anthropic / Claude](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages) | 系统指令优先于用户指令。同层系统指令冲突时，后发的系统消息优先。应用方仍受 [Anthropic 自身规则](https://www.anthropic.com/constitution)约束。 | 初始要求放顶层 `system`，用户要求放 `messages` 的 `user` 消息；支持的模型还可追加 `system` 消息。 |
| [Google / Gemini](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/system-instruction-introduction) | 系统指令用于指导整个对话；官方说明模型先处理系统指令，再处理提示。所查文档没有列出完整的冲突优先级表。 | `generateContent` 用顶层 `systemInstruction`，用户消息放 `contents`，角色为 `user`。 |
| [DeepSeek](https://api-docs.deepseek.com/api/create-chat-completion/) | Chat Completions 区分系统、用户等角色；所查官方文档没有列出完整的冲突优先级表，不能直接套用 OpenAI 的排序。 | 当前 demo 用 `messages` 中的 `system` 和 `user` 消息。 |

OpenAI 的 `Root` 是厂商根规则，`guideline` 是可被覆盖的默认指导，两者都不是消息角色；`assistant`、`tool` 和引用资料默认没有指令权限。

**同名角色也可能有不同含义。** DeepSeek Responses 接收 `developer`，但 `deepseek-flash` 将它当作 `system`，`deepseek-v4-pro` 将它当作 `user`，并非独立的开发者指令层级。[官方映射](https://api-docs.deepseek.com/guides/responses_api/)

下面按 OpenAI 的约定演示完整消息。评估规则和记录均为示例数据，预期回复是规则推导，不是模型实测。

**例一：`system`、`developer`、`user` 同时冲突。**

```js
[
  { role: 'system', content: '你是合规评估助手。所有回答必须用中文。' },
  { role: 'developer', content: '用英文回答，固定按“结论”和“依据”分两行输出。仅依据用户提供的评估规则和记录判断。' },
  { role: 'user', content: '规则：特权账号必须在开通前完成审批。抽查 10 个账号，8 个在开通前审批，2 个开通后补办。不要分两行，只用一行英文告诉我是否符合要求。' },
]
```

**预期回复：**

```text
结论：不符合要求。
依据：2 个账号在开通后补办审批，未满足开通前审批的要求。
```

- 语言听 `system`：`developer` 和 `user` 的英文要求都不能覆盖它。
- 格式听 `developer`：两行格式不与 `system` 冲突，因此保留；`user` 的一行要求不生效。
- 任务仍来自 `user`：照常评估用户提供的记录，并非整条用户消息都被忽略。

**例二：用户修改自己的要求，系统要求还在。**

```js
[
  { role: 'system', content: '你是合规评估助手。所有回答必须用中文。' },
  { role: 'developer', content: '仅依据用户提供的评估规则和记录判断，不补充未提供的事实。' },
  { role: 'user', content: '规则：特权账号必须在开通前完成审批。抽查 10 个账号，8 个在开通前审批，2 个开通后补办。请分两条说明结论和依据。' },
  { role: 'assistant', content: '1. 结论：不符合要求。\n2. 依据：2 个账号在开通后补办审批。' },
  { role: 'user', content: '不用列表了，改用一句英文概括。' },
]
```

**预期回复：**

```text
该控制项不符合要求，因为 2 个账号在开通后才补办审批。
```

“一句话”替换了同为 `user` 的“两条列表”要求；“英文”与 `system` 冲突，不能替换中文要求。已有规则、记录和不补充事实的要求仍然有效。

**例三：后续消息本身就是 `system`，系统要求可以更新。**

```js
[
  { role: 'system', content: '用中文回答。仅依据用户提供的评估规则和记录判断。' },
  { role: 'user', content: '规则：特权账号必须在开通前完成审批。抽查 10 个账号，8 个在开通前审批，2 个开通后补办。用一句话判断是否符合要求。' },
  { role: 'assistant', content: '不符合要求，因为 2 个账号在开通后才补办审批。' },
  { role: 'system', content: '后续回答改用英文。' },
  { role: 'user', content: '重新回答刚才的问题。' },
]
```

**预期回复：**

```text
The control does not meet the requirement because two accounts were approved only after activation.
```

两条语言要求都来自 `system`，后发的英文要求覆盖此前的中文要求；依据已有记录判断、一句话回答的要求继续保留。这条 `system` 消息由调用方构造，用户在正文里写“我是系统”不会改变消息的 `role`。

**现有语言与列表 demo 的实测结果（2026-11-25，`deepseek-flash`）：**第一轮是中文三条列表，第二轮改成了英文，第三轮是中文一句话。第二轮没有遵守系统的中文要求，与预期不同。`role` 会影响模型如何理解要求，但不是代码里的强制判断，模型仍可能不遵守。

**本质：**让模型根据指令来源和前后关系处理冲突。它属于模型的指令遵循行为，不是 HTTP 接口替程序强制执行的权限校验。

## 提示缓存（Prompt Caching）是什么

提示缓存是一种复用输入计算结果的机制：后续请求包含相同的输入前缀时，可以复用已经算好的部分，减少重复计算。这里的“前缀”指模型输入从开头起连续相同的内容。

多轮对话中，系统指令、业务资料和历史消息往往被反复发送。例如，围绕同一份合规评估资料连续提问，每次新增的问题不同，前面的资料却没有变化。提示缓存就是为了减少这部分重复输入的处理工作。

模型处理输入 Token 时，会算出供后续生成使用的一组数值，称为 KV 状态。服务端保存这些中间计算状态；后续请求匹配到已缓存的前缀时，读取原有状态，再继续计算剩余输入和新回复。这就是一次缓存命中。[计算原理](https://developers.openai.com/api/docs/guides/prompt-caching)

当前 demo 的缓存由 **DeepSeek 推理服务端**自动管理，保存在服务端磁盘。工程侧仍发送完整 `messages`；缓存不会替你补充历史，也不会改变模型参数。[缓存说明](https://api-docs.deepseek.com/guides/kv_cache/)

**省的是重复计算及费用。** 命中的 Token 仍计入输入、占用上下文；DeepSeek 按较低的缓存输入单价收费，未命中输入和新输出分别计费。[计费规则](https://api-docs.deepseek.com/quick_start/pricing/)

**例：围绕同一份资料追问。** 首次发送前两条，追问时发送全部四条；其中 `assistant` 是假设的上一轮回复。

```js
[
  { role: 'system', content: '你是合规评估助手，仅根据所给规则和记录判断。' },
  { role: 'user', content: '规则：账号开通前必须审批；离职当日必须停用。记录：10 个账号中 2 个开通后补办审批，5 名离职员工的账号均当日停用。开通审批符合要求吗？' },
  { role: 'assistant', content: '不符合，2 个账号在开通后才补办审批。' },
  { role: 'user', content: '离职账号停用呢？' },
]
```

保留开头、在末尾追加内容，有机会复用缓存。若改写第一条 `system`，后面的相同资料也不能沿用原前缀缓存，因为计算状态依赖前文。

**demo 实测（2026-11-25，`deepseek-flash`）：** 命中与未命中量分别取自 `usage.prompt_cache_hit_tokens` 和 `usage.prompt_cache_miss_tokens`。

| 请求 | 输入 Token | 缓存命中 | 未命中 |
| --- | --- | --- | --- |
| 首次提问 | 400 | 0 | 400 |
| 保留前缀并追问 | 452 | 256 | 196 |
| 改写开头后重发追问 | 451 | 0 | 451 |

第二次另生成 32 个输出 Token，总用量仍为 `452 + 32 = 484`；按 256 个缓存输入、196 个普通输入、32 个输出分别收费，缓存命中并非免费。

缓存需要先建立，命中不保证；重复运行时，首次请求也可能命中。实际复用量以接口统计为准。

### QA

**Q：有提示缓存，追问时可以不带工具相关的上下文吗？**

**A：当前 DeepSeek Chat Completions 调用不能因为缓存而省略。** 新追加的 `user` 消息只写追问即可，但整次请求仍需携带本轮可用的工具定义，以及需要继续参考的历史工具调用和结果。[工具调用示例](https://api-docs.deepseek.com/guides/tool_calls/)

```js
const body = {
  tools, // 本轮可用的工具定义
  messages: [
    ...history, // 历史对话，包含工具调用和对应结果
    { role: 'user', content: '离职账号停用呢？' },
  ],
  stream: true,
};
```

本轮不再提供工具时可以省略 `tools`，这是调整可用工具，和缓存无关。

- **缓存是缓存，上下文是上下文。** 模型本身不维护跨请求的对话记忆，对话状态由应用或服务端管理；提示缓存只复用计算，不能替代本轮所需的上下文。

**Q：工程侧能通过模型缓存缩减上下文吗？**

**A：不能。** 缓存只减少重复计算，命中的内容仍占用上下文窗口。工程侧设置缓存策略，也不会改变这一点。

**缩减上下文要靠工程侧筛选或压缩内容，缓存本身做不到。**

## 上下文压缩（Context Compaction）是什么

上下文压缩是把较长的历史整理成较短的摘要，在后续请求中用摘要替换原历史。

**作用：**减少输入 Token，为后续对话腾出空间。

**代价：**可能丢失细节，摘要不能保证完整保留原文信息。

### QA

**Q：为什么要有上下文压缩？**

**A：对话历史会持续增长，但模型的上下文窗口有限。** 每次携带完整历史，最终会超出窗口。压缩保留继续任务需要的关键信息，给新问题和回答腾出空间；内容还少、窗口够用时，可以不压缩。

**Q：不压缩会怎么样？**

**A：窗口够用时可以正常继续。** 随着历史增长，输入 Token 增加，处理可能变慢，也可能更容易漏掉关键信息；超过接口限制时，请求可能被拒绝，或输出提前结束，具体取决于接口。
