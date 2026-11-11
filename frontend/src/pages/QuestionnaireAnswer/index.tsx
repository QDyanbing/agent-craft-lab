import useUrlState from '@/hooks/useUrlState';
import { Empty, Flex, Spin, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AnswerForm from './components/AnswerForm';
import useAnswer from './hooks/useAnswer';
import styles from './index.module.less';
import useDetail from './models/useDetail';
import usePage from './models/usePage';

export default () => {
  const { uuid: currentUuid, mount, unmount } = usePage();
  const { loading, data } = useDetail();

  const { loading: answering, onAnswer } = useAnswer();

  const [{ uuid }] = useUrlState<{ uuid: string }>();

  const { t } = useTranslation('questionnaireAnswer');

  const isLoading = loading || answering || currentUuid !== uuid;
  const questionnaire = data?.uuid === uuid ? data : undefined;
  const hasQuestions = questionnaire?.modules.some((module) => module.questions.length > 0);

  useEffect(() => {
    mount(uuid);

    return unmount;
  }, [mount, unmount, uuid]);

  return (
    <Spin
      spinning={isLoading}
      classNames={{ root: styles.questionnaireAnswer, container: styles.container }}
    >
      {!questionnaire && !isLoading && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      {questionnaire && (
        <>
          <Flex vertical gap="small" component="header" className={styles.header}>
            <Typography.Title level={1}>{questionnaire.name}</Typography.Title>
            {questionnaire.description && (
              <Typography.Text type="secondary">{questionnaire.description}</Typography.Text>
            )}
          </Flex>
          {hasQuestions ? (
            <AnswerForm key={questionnaire.uuid} questionnaire={questionnaire} onAnswer={onAnswer} />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} />
          )}
        </>
      )}
    </Spin>
  );
};
