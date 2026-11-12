import { setCreate } from '@/services/questionnaire/question';
import { onHistoryAnchorChange } from '@/utils/history';
import { useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useDetail from '../../models/useDetail';
import usePage from '../../models/usePage';
import useQuestionSet from '../../models/useQuestionSet';

export default () => {
  const { uuid } = usePage();
  const { onRefresh } = useDetail();
  const { moduleUuid, onCancel } = useQuestionSet();

  const { t } = useTranslation('questionnaireQuestions');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setCreate, { manual: true });

  const onCreate = async (params: API.IQuestionnaireQuestionSetParams) => {
    if (!uuid || !moduleUuid) return;

    const result = await runAsync(uuid, moduleUuid, params);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('saved'));
    onCancel();
    await onRefresh();
    if (usePage.getState().uuid === uuid) onHistoryAnchorChange(result.data.uuid);
  };

  return { loading, onCreate };
};
