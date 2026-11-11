declare namespace API {
  type TQuestionnaireQuestionType = 'SINGLE' | 'MULTIPLE' | 'TEXT' | 'NUMBER';

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
    answer?: number | number[] | string;
  }
}
