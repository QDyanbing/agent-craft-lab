declare namespace API {
  interface QuestionnaireSetParams {
    name: string;
    description?: string;
  }

  interface QuestionnaireParams {
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface Questionnaire {
    uuid: string;
    name: string;
    description: string;
    modules: QuestionnaireModule[];
  }

  interface QuestionnaireCreated {
    uuid: string;
  }

  interface QuestionnaireDetail extends Questionnaire {
    revision: string;
  }

  interface QuestionnaireResponseSetParams {
    requestId: string;
    revision: string;
    answers: Record<string, number | number[] | string>;
  }

  interface QuestionnaireSummary extends Omit<Questionnaire, 'modules'> {
    moduleCount: number;
    questionCount: number;
  }

  interface QuestionnaireModuleSetParams {
    name: string;
  }

  interface QuestionnaireModule extends QuestionnaireModuleSetParams {
    uuid: string;
    questions: QuestionnaireQuestion[];
  }

  type QuestionnaireQuestionSetParams = {
    title: string;
    description?: string;
  } & (
    | { type: 'single' | 'multiple'; options: string[] }
    | { type: 'text' | 'number'; options?: string[] }
  );

  interface QuestionnaireQuestion {
    uuid: string;
    type: QuestionnaireQuestionType;
    title: string;
    description: string;
    options: string[];
  }

  type QuestionnaireQuestionType = 'single' | 'multiple' | 'text' | 'number';
}
