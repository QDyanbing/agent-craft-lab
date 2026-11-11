declare namespace API {
  interface IQuestionnaireSetParams {
    name: string;
    description?: string;
  }

  interface IQuestionnaireParams {
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface IQuestionnaire {
    uuid: string;
    name: string;
    description: string;
    moduleCount: number;
    questionCount: number;
  }

  interface IQuestionnaireDetail {
    uuid: string;
    name: string;
    description: string;
    modules: IQuestionnaireModule[];
  }
}
