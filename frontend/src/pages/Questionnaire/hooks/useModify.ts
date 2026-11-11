import { setModify } from '@/services/questionnaire/questionnaire';
import { useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useData from '../models/useData';
import useDataSet from '../models/useDataSet';

export default () => {
  const { onRefresh } = useData.getState();
  const { onCancel } = useDataSet.getState();

  const { t } = useTranslation('questionnaire');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setModify, { manual: true });

  const onModify = async (values: API.IQuestionnaireSetParams) => {
    const { questionnaire } = useDataSet.getState();
    if (!questionnaire) return;

    const result = await runAsync(questionnaire.uuid, values);
    if (!result) return;

    message.success(t('message.modifySuccess'));
    onCancel();
    onRefresh();
  };

  return { loading, onModify };
};
