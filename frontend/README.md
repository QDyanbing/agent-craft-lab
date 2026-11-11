# CraftLab 问卷前端

首页进入问卷列表。可按名称或描述搜索问卷，创建问卷，在编辑器中维护模块和题目，或进入答题页提交答案。支持单选、多选、文本和数字四种题型。

## 本地开发

在仓库根目录运行 `npm start` 同时启动前后端。首次使用见[本地启动说明](../README.md#本地启动问卷项目)。

打开 [本地问卷列表](http://localhost:8000/questionnaires)。Vite 默认把问卷请求转发到端口 3000，问卷和答卷保存在 `backend/data/questionnaires.sqlite`。

## 开发检查

| 命令                     | 用途                       |
| ------------------------ | -------------------------- |
| `ut run build`           | 类型检查和生产构建         |
| `ut run lint`            | ESLint 和 Stylelint        |
| `ut run format:check`    | 检查代码格式               |
| `ut run test:unit`       | 运行单元测试               |
| `ut run test:e2e`        | 运行问卷浏览器测试         |
| `ut run test:e2e:headed` | 在可见浏览器中运行功能测试 |

浏览器测试自动启动独立的 Nest 后端，使用临时 SQLite 内存库。

开发约定见 [AGENTS.md](AGENTS.md)。部署和代理配置见[部署说明](docs/17_deployment.md)。
