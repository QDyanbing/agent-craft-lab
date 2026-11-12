import AddButton from '@/components/AddButton';
import useAnchorScroll from '@/hooks/useAnchorScroll';
import useUrlState from '@/hooks/useUrlState';
import { Empty, Flex, Spin, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ModuleForm from './components/ModuleForm';
import ModuleItem from './components/ModuleItem';
import Outline from './components/Outline';
import QuestionForm from './components/QuestionForm';
import styles from './index.module.less';
import useDetail from './models/useDetail';
import useModuleSet from './models/useModuleSet';
import usePage from './models/usePage';

export default () => {
  const { mount, unmount } = usePage();
  const { loading, data: questionnaire } = useDetail();
  const { onCreate } = useModuleSet();

  const [{ uuid }] = useUrlState<{ uuid: string }>();
  const { selected, entryRef, onScrollChange } = useAnchorScroll();

  const { t } = useTranslation('questionnaireQuestions');

  useEffect(() => {
    mount(uuid);

    return unmount;
  }, [uuid]);

  return (
    <Spin
      spinning={loading}
      classNames={{ root: styles.questionnaireQuestions, container: styles.container }}
    >
      {!questionnaire && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      {questionnaire && (
        <>
          <Flex vertical gap="small" component="header" className={styles.header}>
            <Typography.Title level={3}>{questionnaire.name}</Typography.Title>
            {questionnaire.description && (
              <Typography.Text type="secondary">{questionnaire.description}</Typography.Text>
            )}
          </Flex>
          {questionnaire.modules.length > 0 ? (
            <Flex className={styles.workspace}>
              <Outline data={questionnaire.modules} selected={selected} onSelect={onScrollChange} />
              <Flex vertical gap="large" className={styles.document}>
                {questionnaire.modules.map((module, index) => (
                  <ModuleItem
                    key={module.uuid}
                    data={module}
                    number={index + 1}
                    selected={selected}
                    entryRef={entryRef}
                  />
                ))}
              </Flex>
            </Flex>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('moduleEmpty')}
              className={styles.empty}
            >
              <AddButton label={t('newModule')} onClick={onCreate} />
            </Empty>
          )}
        </>
      )}
      <ModuleForm />
      <QuestionForm />
    </Spin>
  );
};
