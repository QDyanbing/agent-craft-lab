import { setAnswer } from '@/services/questionnaire/question';
import { useRequest } from 'ahooks';
import useDetail from '../models/useDetail';
import usePage from '../models/usePage';

export default () => {
  const { onAnswer: onDetailAnswer } = useDetail.getState();

  const { loading, runAsync } = useRequest(setAnswer, { manual: true });

  const onAnswer = async (
    moduleUuid: string,
    questionUuid: string,
    answer: number | number[] | string,
  ) => {
    const { uuid } = usePage.getState();
    if (!uuid) return;

    const result = await runAsync(uuid, moduleUuid, questionUuid, answer);
    if (!result || usePage.getState().uuid !== uuid) return;

    onDetailAnswer(moduleUuid, questionUuid, answer);
  };

  return { loading, onAnswer };
};
