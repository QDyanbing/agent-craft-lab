import { setModuleCreate } from '@/services/questionnaire';
import { onHistoryAnchorChange } from '@/utils/history';
import { useLockFn, useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useDetail from '../../models/useDetail';
import useEditor from '../../models/useEditor';
import usePage from '../../models/usePage';

export default () => {
  const { onRefresh } = useDetail.getState();
  const { onClose } = useEditor.getState();

  const { t } = useTranslation('questionnaireQuestions');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setModuleCreate, { manual: true });

  const onCreate = useLockFn(async (params: API.QuestionnaireModuleSetParams) => {
    const { uuid } = usePage.getState();
    const { dialog } = useEditor.getState();
    if (!uuid || dialog?.kind !== 'module') return;

    const result = await runAsync(uuid, params);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('saved'));
    onClose();
    await onRefresh();
    if (usePage.getState().uuid === uuid) onHistoryAnchorChange(result.data.uuid);
  });

  return { loading, onCreate };
};
