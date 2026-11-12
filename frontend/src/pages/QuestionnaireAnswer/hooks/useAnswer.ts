import { setAnswer } from '@/services/questionnaire/question';
import { useRequest } from 'ahooks';
import usePage from '../models/usePage';

export default () => {
  const { uuid } = usePage();

  const { loading, runAsync } = useRequest(setAnswer, { manual: true });

  const onAnswer = async (
    moduleUuid: string,
    questionUuid: string,
    answer: API.TQuestionnaireAnswer | null,
  ) => {
    if (!uuid) return;

    await runAsync(uuid, moduleUuid, questionUuid, answer);
  };

  return { loading, onAnswer };
};
