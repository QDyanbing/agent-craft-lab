import { setCreate } from '@/services/questionnaire/module';
import { onHistoryAnchorChange } from '@/utils/history';
import { useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useDetail from '../../models/useDetail';
import useModuleSet from '../../models/useModuleSet';
import usePage from '../../models/usePage';

export default () => {
  const { uuid } = usePage();
  const { onRefresh } = useDetail();
  const { onCancel } = useModuleSet();

  const { t } = useTranslation('questionnaireQuestions');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setCreate, { manual: true });

  const onCreate = async (params: API.IQuestionnaireModuleSetParams) => {
    if (!uuid) return;

    const result = await runAsync(uuid, params);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('saved'));
    onCancel();
    await onRefresh();
    if (usePage.getState().uuid === uuid) onHistoryAnchorChange(result.data.uuid);
  };

  return { loading, onCreate };
};
