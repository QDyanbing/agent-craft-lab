declare namespace API {
  type TQuestionnaireQuestionType = 'SINGLE' | 'MULTIPLE' | 'TEXT' | 'NUMBER';
  type TQuestionnaireAnswer = number | number[] | string;

  interface IQuestionnaireQuestionSetParams {
    type: TQuestionnaireQuestionType;
    title: string;
    description?: string;
    options?: string[];
  }

  interface IQuestionnaireQuestion {
    uuid: string;
    type: TQuestionnaireQuestionType;
    title: string;
    description: string;
    options: string[];
    answer?: TQuestionnaireAnswer;
  }
}
