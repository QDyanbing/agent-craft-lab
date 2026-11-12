import { setModify } from '@/services/questionnaire/module';
import { useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useDetail from '../../models/useDetail';
import useModuleSet from '../../models/useModuleSet';
import usePage from '../../models/usePage';

export default () => {
  const { uuid } = usePage();
  const { onRefresh } = useDetail();
  const { module, onCancel } = useModuleSet();

  const { t } = useTranslation('questionnaireQuestions');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setModify, { manual: true });

  const onModify = async (params: API.IQuestionnaireModuleSetParams) => {
    if (!uuid || !module) return;

    const result = await runAsync(uuid, module.uuid, params);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('saved'));
    onCancel();
    await onRefresh();
  };

  return { loading, onModify };
};
