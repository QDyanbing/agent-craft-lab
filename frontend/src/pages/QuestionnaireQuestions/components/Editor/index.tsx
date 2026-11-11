import AddButton from '@/components/AddButton';
import { onHistoryAnchorChange } from '@/utils/history';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useLocation } from '@tanstack/react-router';
import { Empty, Flex, Grid, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useModuleSet from '../../models/useModuleSet';
import useQuestionSet from '../../models/useQuestionSet';
import ModuleForm from '../ModuleForm';
import ModuleSection from '../ModuleSection';
import Outline from '../Outline';
import QuestionForm from '../QuestionForm';
import styles from './index.module.less';

interface Props {
  questionnaire: API.IQuestionnaireDetail;
  onDeleteModule: (moduleUuid: string) => Promise<void>;
  onDeleteQuestion: (moduleUuid: string, questionUuid: string) => Promise<void>;
}

const scrollToEntry = (uuid: string) =>
  document.getElementById(uuid)?.scrollIntoView({ block: 'start', inline: 'nearest' });

export default ({ questionnaire, onDeleteModule, onDeleteQuestion }: Props) => {
  const { module: editingModule, onCreate } = useModuleSet();
  const { question: editingQuestion } = useQuestionSet();

  const hash = useLocation({ select: (location) => location.hash });
  const screens = Grid.useBreakpoint();

  const { t } = useTranslation('questionnaireQuestions');

  const moduleUuid = hash
    ? questionnaire.modules.find(
        (module) =>
          module.uuid === hash || module.questions.some((question) => question.uuid === hash),
      )?.uuid
    : undefined;
  const selectedUuid = moduleUuid ? hash : undefined;
  const onSelect = (uuid: string) => {
    if (uuid === hash) scrollToEntry(uuid);
    else onHistoryAnchorChange(uuid);
  };

  useEffect(() => {
    if (!hash) return;
    if (!moduleUuid) {
      onHistoryAnchorChange('');
      return;
    }
    scrollToEntry(hash);
  }, [hash, moduleUuid]);

  return (
    <Flex vertical gap="middle" className={styles.editor}>
      <Flex vertical gap="small" component="header" className={styles.header}>
        <Typography.Title level={1} className={styles.questionnaireTitle}>
          {questionnaire.name}
        </Typography.Title>
        {questionnaire.description && (
          <Typography.Text type="secondary">{questionnaire.description}</Typography.Text>
        )}
      </Flex>
      {questionnaire.modules.length > 0 ? (
        <Flex vertical={!screens.md} data-compact={!screens.md} className={styles.workspace}>
          <Outline modules={questionnaire.modules} selectedUuid={selectedUuid} onSelect={onSelect} />
          <Flex vertical gap="large" className={styles.document}>
            {questionnaire.modules.map((module, index) => (
              <ModuleSection
                key={module.uuid}
                module={module}
                number={index + 1}
                selectedUuid={selectedUuid}
                onDeleteModule={onDeleteModule}
                onDeleteQuestion={onDeleteQuestion}
              />
            ))}
          </Flex>
        </Flex>
      ) : (
        <Flex align="center" justify="center" className={styles.blankModule}>
          <Empty
            image={<FolderOpenOutlined />}
            description={
              <Flex vertical gap="small">
                <Typography.Title level={4}>{t('moduleEmpty')}</Typography.Title>
                <Typography.Text type="secondary">{t('firstModule')}</Typography.Text>
              </Flex>
            }
            classNames={{ image: styles.emptyIcon }}
          >
            <AddButton label={t('newModule')} onClick={onCreate} />
          </Empty>
        </Flex>
      )}
      {editingModule !== undefined && <ModuleForm module={editingModule ?? undefined} />}
      {editingQuestion !== undefined && <QuestionForm question={editingQuestion ?? undefined} />}
    </Flex>
  );
};
