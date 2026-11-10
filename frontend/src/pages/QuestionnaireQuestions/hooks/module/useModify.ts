import useRequestAction from '@/hooks/useRequestAction';
import { setModuleModify } from '@/services/questionnaire';
import { useRequest } from 'ahooks';
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

  const { loading, runAsync } = useRequest(setModuleModify, { manual: true });

  const onModify = useRequestAction(async (params: API.QuestionnaireModuleSetParams) => {
    const { uuid } = usePage.getState();
    const { dialog } = useEditor.getState();
    if (!uuid || dialog?.kind !== 'module' || !dialog.moduleUuid) return;

    const result = await runAsync(uuid, dialog.moduleUuid, params);
    if (!result || usePage.getState().uuid !== uuid) return;

    message.success(t('saved'));
    onClose();
    await onRefresh();
  });

  return { loading, onModify };
};
