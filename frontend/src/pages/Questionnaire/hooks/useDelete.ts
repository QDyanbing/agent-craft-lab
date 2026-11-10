import { setDelete } from '@/services/questionnaire';
import { useLockFn, useRequest } from 'ahooks';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import useData from '../models/useData';
import usePage from '../models/usePage';

export default () => {
  const { t } = useTranslation('questionnaire');

  const { message } = App.useApp();

  const { loading, runAsync } = useRequest(setDelete, { manual: true });

  const onDelete = useLockFn(async (uuid: string) => {
    const result = await runAsync(uuid);
    if (!result || !usePage.getState().ready) return;

    message.success(t('deleted'));
    await useData.getState().onRefresh();
  });

  return { loading, onDelete };
};
