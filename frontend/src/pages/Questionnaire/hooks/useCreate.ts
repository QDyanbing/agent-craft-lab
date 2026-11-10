import { setCreate } from '@/services/questionnaire';
import { onHistoryChange } from '@/utils/history';
import { useLockFn, useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import usePage from '../models/usePage';

export default () => {
  const { t } = useTranslation('questionnaire');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setCreate, { manual: true });

  const onCreate = useLockFn(async (params: API.QuestionnaireSetParams) => {
    const result = await runAsync(params);
    if (!result || !usePage.getState().ready) return;

    message.success(t('created'));
    onHistoryChange('/questionnaires/questions', { uuid: result.data.uuid });
  });

  return { loading, onCreate };
};
