import Request from '@/utils/request';

export const setCreate = (data: API.IQuestionnaireSetParams) =>
  Request.post<API.IQuestionnaireSetParams, Pick<API.IQuestionnaire, 'uuid'>>(
    `/api/questionnaires`,
    data,
  );

export const setModify = (uuid: string, data: API.IQuestionnaireSetParams) =>
  Request.put<API.IQuestionnaireSetParams, null>(`/api/questionnaires/${uuid}`, data);

export const setDelete = (uuid: string) =>
  Request.delete<undefined, null>(`/api/questionnaires/${uuid}`);

export const getSearch = (data: API.IQuestionnaireParams) =>
  Request.get<API.IQuestionnaireParams, API.PageResult<API.IQuestionnaire>>(
    `/api/questionnaires`,
    data,
  );

export const getDetail = (uuid: string) =>
  Request.get<undefined, API.IQuestionnaireDetail>(`/api/questionnaires/${uuid}`);
