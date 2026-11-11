declare namespace API {
  interface IQuestionnaireModuleSetParams {
    name: string;
  }

  interface IQuestionnaireModule {
    uuid: string;
    name: string;
    questions: IQuestionnaireQuestion[];
  }
}
