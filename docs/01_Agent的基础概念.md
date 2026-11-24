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

**本质：**给模型的全部输入，即聊天记录

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
- **开发者指令**　`developer`（OpenAI Chat Completions、OpenAI Responses）。
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
