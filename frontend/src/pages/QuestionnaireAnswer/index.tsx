import useUrlState from '@/hooks/useUrlState';
import { Button, Empty, Flex, Result, Spin, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AnswerForm from './components/AnswerForm';
import useCreate from './hooks/useCreate';
import styles from './index.module.less';
import useDetail from './models/useDetail';
import usePage from './models/usePage';

export default () => {
  const { uuid: currentUuid, mount, unmount } = usePage();
  const { data, loading, onRefresh } = useDetail();
  const { loading: submitting, onCreate } = useCreate();
  const [{ uuid }] = useUrlState<{ uuid: string }>();
  const { t } = useTranslation('questionnaireAnswer');
  const pending = loading || currentUuid !== uuid;

  useEffect(() => {
    mount(uuid);
    return unmount;
  }, [mount, unmount, uuid]);

  return (
    <Spin
      spinning={pending || submitting}
      classNames={{ root: styles.questionnaireAnswer, container: styles.container }}
    >
      {data && data.uuid === uuid ? (
        <>
          <Flex vertical gap="small" component="header" className={styles.header}>
            <Typography.Title level={1}>{data.name}</Typography.Title>
            {data.description && (
              <Typography.Text type="secondary">{data.description}</Typography.Text>
            )}
          </Flex>
          {data.modules.some((module) => module.questions.length) ? (
            <AnswerForm key={data.uuid} survey={data} loading={submitting} onCreate={onCreate} />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} />
          )}
        </>
      ) : (
        !pending && (
          <Result
            status="warning"
            title={t('unavailable')}
            extra={uuid && <Button onClick={onRefresh}>{t('retry')}</Button>}
          />
        )
      )}
    </Spin>
  );
};
