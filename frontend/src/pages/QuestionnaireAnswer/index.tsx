import useUrlState from '@/hooks/useUrlState';
import { Empty, Flex, Spin, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AnswerForm from './components/AnswerForm';
import useCreate from './hooks/useCreate';
import styles from './index.module.less';
import useDetail from './models/useDetail';
import usePage from './models/usePage';

export default () => {
  const { uuid: currentUuid, mount, unmount } = usePage();
  const { loading, data } = useDetail();

  const { loading: submitting, onCreate } = useCreate();

  const [{ uuid }] = useUrlState<{ uuid: string }>();

  const { t } = useTranslation('questionnaireAnswer');

  const isLoading = loading || currentUuid !== uuid;
  const survey = data?.uuid === uuid ? data : undefined;
  const hasQuestions = survey?.modules.some((module) => module.questions.length > 0);

  useEffect(() => {
    mount(uuid);

    return unmount;
  }, [mount, unmount, uuid]);

  return (
    <Spin
      spinning={isLoading || submitting}
      classNames={{ root: styles.questionnaireAnswer, container: styles.container }}
    >
      {!survey && !isLoading && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      {survey && (
        <>
          <Flex vertical gap="small" component="header" className={styles.header}>
            <Typography.Title level={1}>{survey.name}</Typography.Title>
            {survey.description && (
              <Typography.Text type="secondary">{survey.description}</Typography.Text>
            )}
          </Flex>
          {hasQuestions ? (
            <AnswerForm
              key={survey.uuid}
              survey={survey}
              loading={submitting}
              onCreate={onCreate}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} />
          )}
        </>
      )}
    </Spin>
  );
};
