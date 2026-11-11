import { setModify } from '@/services/questionnaire/question';
import { useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useDetail from '../../models/useDetail';
import useQuestionSet from '../../models/useQuestionSet';
import usePage from '../../models/usePage';

export default () => {
  const { onRefresh } = useDetail.getState();
  const { onCancel } = useQuestionSet.getState();

  const { t } = useTranslation('questionnaireQuestions');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setModify, { manual: true });

  const onModify = async (params: API.IQuestionnaireQuestionSetParams) => {
    const { uuid } = usePage.getState();
    const { moduleUuid, question } = useQuestionSet.getState();
    if (!uuid || !moduleUuid || !question) return;

    const result = await runAsync(uuid, moduleUuid, question.uuid, params);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('saved'));
    onCancel();
    await onRefresh();
  };

  return { loading, onModify };
};
