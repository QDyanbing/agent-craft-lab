import Request from '@/utils/request';

export const setCreate = (questionnaireUuid: string, data: API.IQuestionnaireModuleSetParams) =>
  Request.post<API.IQuestionnaireModuleSetParams, Pick<API.IQuestionnaireModule, 'uuid'>>(
    `/api/questionnaires/${questionnaireUuid}/modules`,
    data,
  );

export const setModify = (
  questionnaireUuid: string,
  moduleUuid: string,
  data: API.IQuestionnaireModuleSetParams,
) =>
  Request.put<API.IQuestionnaireModuleSetParams, null>(
    `/api/questionnaires/${questionnaireUuid}/modules/${moduleUuid}`,
    data,
  );

export const setDelete = (questionnaireUuid: string, moduleUuid: string) =>
  Request.delete<undefined, null>(
    `/api/questionnaires/${questionnaireUuid}/modules/${moduleUuid}`,
  );
