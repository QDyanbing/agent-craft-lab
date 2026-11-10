import Request from '@/utils/request';

const nameValidation = { localErrorKeys: ['questionnaire:errors.duplicateName'] };

export const setCreate = (data: API.QuestionnaireSetParams) =>
  Request.post<API.QuestionnaireSetParams, API.QuestionnaireCreated>(
    `/api/questionnaires`,
    data,
    nameValidation,
  );

export const setModify = (uuid: string, data: API.QuestionnaireSetParams) =>
  Request.put<API.QuestionnaireSetParams, null>(
    `/api/questionnaires/${uuid}`,
    data,
    nameValidation,
  );

export const setDelete = (uuid: string) =>
  Request.delete<undefined, null>(`/api/questionnaires/${uuid}`);

export const setModuleCreate = (survey: string, data: API.QuestionnaireModuleSetParams) =>
  Request.post<API.QuestionnaireModuleSetParams, API.QuestionnaireCreated>(
    `/api/questionnaires/${survey}/modules`,
    data,
  );

export const setModuleModify = (
  survey: string,
  module: string,
  data: API.QuestionnaireModuleSetParams,
) =>
  Request.put<API.QuestionnaireModuleSetParams, null>(
    `/api/questionnaires/${survey}/modules/${module}`,
    data,
  );

export const setModuleDelete = (survey: string, module: string) =>
  Request.delete<undefined, null>(`/api/questionnaires/${survey}/modules/${module}`);

export const setQuestionCreate = (
  survey: string,
  module: string,
  data: API.QuestionnaireQuestionSetParams,
) =>
  Request.post<API.QuestionnaireQuestionSetParams, API.QuestionnaireCreated>(
    `/api/questionnaires/${survey}/modules/${module}/questions`,
    data,
  );

export const setQuestionModify = (
  survey: string,
  module: string,
  question: string,
  data: API.QuestionnaireQuestionSetParams,
) =>
  Request.put<API.QuestionnaireQuestionSetParams, null>(
    `/api/questionnaires/${survey}/modules/${module}/questions/${question}`,
    data,
  );

export const setQuestionDelete = (survey: string, module: string, question: string) =>
  Request.delete<undefined, null>(
    `/api/questionnaires/${survey}/modules/${module}/questions/${question}`,
  );

export const setResponseCreate = (survey: string, data: API.QuestionnaireResponseSetParams) =>
  Request.post<API.QuestionnaireResponseSetParams, API.QuestionnaireCreated>(
    `/api/questionnaires/${survey}/responses`,
    data,
  );

export const getSearch = (data: API.QuestionnaireParams) =>
  Request.get<API.QuestionnaireParams, API.PageResult<API.QuestionnaireSummary>>(
    `/api/questionnaires`,
    data,
  );

export const getDetail = (uuid: string) =>
  Request.get<undefined, API.QuestionnaireDetail>(`/api/questionnaires/${uuid}`);
