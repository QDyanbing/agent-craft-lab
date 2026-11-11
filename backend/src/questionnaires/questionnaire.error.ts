import type { StatementResultingChanges } from 'node:sqlite';
import { HttpException } from '@nestjs/common';

const errors = {
  required: [400, '请检查必填字段'],
  type: [400, '无效的题目类型'],
  options: [400, '请添加选项'],
  form: [400, '无效的表单'],
  pagination: [400, '无效的分页参数'],
  answer: [400, '请检查答案的题型和选项'],
  emptyAnswer: [400, '请至少回答一道题'],
  survey: [404, '问卷不存在'],
  module: [404, '模块不存在'],
  record: [404, '记录不存在'],
  duplicateName: [409, '问卷名称已存在，请换一个名称'],
  changed: [409, '问卷已修改，请刷新后重新填写'],
  submitted: [409, '这份答卷已经提交'],
} as const;

export class QuestionnaireError extends HttpException {
  constructor(key: keyof typeof errors) {
    const [status, message] = errors[key];
    super(
      { success: false, errorKey: `questionnaire:errors.${key}`, errorMessage: message },
      status,
    );
  }
}

export function changed(result: StatementResultingChanges) {
  if (!result.changes) throw new QuestionnaireError('record');
  return null;
}
