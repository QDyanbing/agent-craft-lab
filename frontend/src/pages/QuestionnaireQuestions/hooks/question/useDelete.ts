import { setQuestionDelete } from '@/services/questionnaire';
import { useLockFn, useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useDetail from '../../models/useDetail';
import usePage from '../../models/usePage';

export default () => {
  const { onRefresh } = useDetail.getState();

  const { t } = useTranslation('questionnaireQuestions');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setQuestionDelete, { manual: true });

  const onDelete = useLockFn(async (moduleUuid: string, questionUuid: string) => {
    const { uuid } = usePage.getState();
    if (!uuid) return;

    const result = await runAsync(uuid, moduleUuid, questionUuid);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('deleted'));
    await onRefresh();
  });

  return { loading, onDelete };
};
