# 本地问卷 API

问卷后端使用 NestJS、Fastify 和 SQLite，默认监听 `127.0.0.1:3000`。问卷和答卷保存在 `backend/data/questionnaires.sqlite`，重启后可继续使用。

## 运行

使用 Node.js 24，在 `backend` 目录安装依赖并启动服务。

```sh
npm ci
npm run dev
```

前端会把 `/api/questionnaires` 请求转发到本地后端。需要更换数据库文件时，设置 `QUESTIONNAIRE_DB` 为文件路径。需要更换监听端口时，设置 `PORT`，并同步调整前端的 `QUESTIONNAIRE_API_TARGET`。

`npm test` 会编译后端，在临时数据库中验证问卷编辑、四种题型、答卷提交、重启回显和旧数据升级。运行编译后的服务可执行 `npm run build` 和 `npm start`。

如需备份问卷，在 `backend` 目录运行以下命令，目标文件名可自行更换。

```sh
sqlite3 data/questionnaires.sqlite ".backup 'data/questionnaires-backup.sqlite'"
```
