import { setModify } from '@/services/questionnaire/question';
import { useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useDetail from '../../models/useDetail';
import usePage from '../../models/usePage';
import useQuestionSet from '../../models/useQuestionSet';

export default () => {
  const { uuid } = usePage();
  const { onRefresh } = useDetail();
  const { moduleUuid, question, onCancel } = useQuestionSet();

  const { t } = useTranslation('questionnaireQuestions');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setModify, { manual: true });

  const onModify = async (params: API.IQuestionnaireQuestionSetParams) => {
    if (!uuid || !moduleUuid || !question) return;

    const result = await runAsync(uuid, moduleUuid, question.uuid, params);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('saved'));
    onCancel();
    await onRefresh();
  };

  return { loading, onModify };
};
