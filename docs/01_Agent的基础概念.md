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
