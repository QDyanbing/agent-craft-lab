import Request from '@/utils/request';

export const setCreate = (
  questionnaireUuid: string,
  moduleUuid: string,
  data: API.IQuestionnaireQuestionSetParams,
) =>
  Request.post<API.IQuestionnaireQuestionSetParams, Pick<API.IQuestionnaireQuestion, 'uuid'>>(
    `/api/questionnaires/${questionnaireUuid}/modules/${moduleUuid}/questions`,
    data,
  );

export const setModify = (
  questionnaireUuid: string,
  moduleUuid: string,
  questionUuid: string,
  data: API.IQuestionnaireQuestionSetParams,
) =>
  Request.put<API.IQuestionnaireQuestionSetParams, null>(
    `/api/questionnaires/${questionnaireUuid}/modules/${moduleUuid}/questions/${questionUuid}`,
    data,
  );

export const setDelete = (questionnaireUuid: string, moduleUuid: string, questionUuid: string) =>
  Request.delete<undefined, null>(
    `/api/questionnaires/${questionnaireUuid}/modules/${moduleUuid}/questions/${questionUuid}`,
  );

export const setAnswer = (
  questionnaireUuid: string,
  moduleUuid: string,
  questionUuid: string,
  answer: API.TQuestionnaireAnswer | null,
) =>
  Request.post<{ answer: API.TQuestionnaireAnswer | null }, { uuid: string } | null>(
    `/api/questionnaires/${questionnaireUuid}/modules/${moduleUuid}/questions/${questionUuid}/answer`,
    { answer },
  );
