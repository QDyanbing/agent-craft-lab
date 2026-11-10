import useRequestAction from '@/hooks/useRequestAction';
import { setCreate } from '@/services/questionnaire';
import { onHistoryChange } from '@/utils/history';
import { useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation('questionnaire');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setCreate, { manual: true });

  const onCreate = useRequestAction(async (params: API.QuestionnaireSetParams) => {
    const result = await runAsync(params);
    if (!result) return;

    message.success(t('message.createSuccess'));
    onHistoryChange('/questionnaires/questions', { uuid: result.data.uuid });
  });

  return { loading, onCreate };
};
