import { setModify } from '@/services/questionnaire';
import { useLockFn, useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useData from '../models/useData';
import useDialog from '../models/useDialog';

export default () => {
  const { onRefresh } = useData.getState();
  const { onClose } = useDialog.getState();

  const { t } = useTranslation('questionnaire');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setModify, { manual: true });

  const onModify = useLockFn(async (values: API.QuestionnaireSetParams) => {
    const { dialog } = useDialog.getState();
    if (!dialog?.survey) return;
    const result = await runAsync(dialog.survey.uuid, values);
    if (!result || useDialog.getState().dialog !== dialog) return;

    message.success(t('saved'));
    onClose();
    await onRefresh();
  });

  return { loading, onModify };
};
