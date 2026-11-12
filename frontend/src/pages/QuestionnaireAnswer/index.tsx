import useUrlState from '@/hooks/useUrlState';
import { Card, Empty, Flex, Form, Spin, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AnswerItem from './components/AnswerItem';
import useAnswer from './hooks/useAnswer';
import styles from './index.module.less';
import useDetail from './models/useDetail';
import usePage from './models/usePage';

export default () => {
  const { mount, unmount } = usePage();
  const { loading, data: questionnaire } = useDetail();

  const { loading: answering, onAnswer } = useAnswer();

  const [{ uuid }] = useUrlState<{ uuid: string }>();

  const { t } = useTranslation('questionnaireAnswer');

  const hasQuestions = questionnaire?.modules.some((module) => module.questions.length > 0);

  useEffect(() => {
    mount(uuid);

    return unmount;
  }, [uuid]);

  return (
    <Spin
      spinning={loading || answering}
      classNames={{ root: styles.questionnaireAnswer, container: styles.container }}
    >
      {!questionnaire && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      {questionnaire && (
        <>
          <Flex vertical gap="small" component="header" className={styles.header}>
            <Typography.Title level={1}>{questionnaire.name}</Typography.Title>
            {questionnaire.description && (
              <Typography.Text type="secondary">{questionnaire.description}</Typography.Text>
            )}
          </Flex>
          {hasQuestions ? (
            <Form key={questionnaire.uuid} layout="vertical" className={styles.form}>
              {questionnaire.modules.map(
                (module, moduleIndex) =>
                  module.questions.length > 0 && (
                    <Card
                      key={module.uuid}
                      role="region"
                      aria-label={module.name}
                      title={<Typography.Title level={3}>{module.name}</Typography.Title>}
                    >
                      {module.questions.map((question, index) => (
                        <AnswerItem
                          key={question.uuid}
                          question={question}
                          number={`${moduleIndex + 1}.${index + 1}`}
                          onAnswer={(value) => onAnswer(module.uuid, question.uuid, value)}
                        />
                      ))}
                    </Card>
                  ),
              )}
            </Form>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} />
          )}
        </>
      )}
    </Spin>
  );
};
