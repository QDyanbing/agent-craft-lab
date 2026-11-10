import useUrlState from '@/hooks/useUrlState';
import { onHistoryBack } from '@/utils/history';
import { Button, Result, Space, Spin } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Editor from './components/Editor';
import useDeleteModule from './hooks/module/useDelete';
import useDeleteQuestion from './hooks/question/useDelete';
import styles from './index.module.less';
import useDetail from './models/useDetail';
import usePage from './models/usePage';

export default () => {
  const { uuid: currentUuid, mount, unmount } = usePage();
  const { loading, data, onRefresh } = useDetail();

  const { loading: deletingModule, onDelete: onDeleteModule } = useDeleteModule();
  const { loading: deletingQuestion, onDelete: onDeleteQuestion } = useDeleteQuestion();

  const [{ uuid }] = useUrlState<{ uuid: string }>();

  const { t } = useTranslation('questionnaireEdit');

  const isLoading = loading || uuid !== currentUuid;

  useEffect(() => {
    mount(uuid);

    return unmount;
  }, [mount, unmount, uuid]);

  return (
    <Spin
      spinning={isLoading || deletingModule || deletingQuestion}
      classNames={{ root: styles.questionnaireEdit, container: styles.container }}
    >
      {data && data.uuid === uuid ? (
        <Editor
          key={uuid}
          survey={data}
          onDeleteModule={onDeleteModule}
          onDeleteQuestion={onDeleteQuestion}
        />
      ) : (
        !isLoading && (
          <Result
            status="warning"
            title={t('unavailable')}
            extra={
              <Space>
                <Button onClick={() => onHistoryBack('/questionnaires')}>{t('back')}</Button>
                {uuid && <Button onClick={onRefresh}>{t('retry')}</Button>}
              </Space>
            }
          />
        )
      )}
    </Spin>
  );
};
