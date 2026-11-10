import useRequestAction from '@/hooks/useRequestAction';
import { setResponseCreate } from '@/services/questionnaire';
import { onHistoryBack } from '@/utils/history';
import { useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import usePage from '../models/usePage';

export default () => {
  const { t } = useTranslation('questionnaireAnswer');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setResponseCreate, { manual: true });

  const onCreate = useRequestAction(async (params: API.QuestionnaireResponseSetParams) => {
    const { uuid } = usePage.getState();
    if (!uuid) return;

    const result = await runAsync(uuid, params);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('submitted'));
    onHistoryBack('/questionnaires');
  });

  return { loading, onCreate };
};
