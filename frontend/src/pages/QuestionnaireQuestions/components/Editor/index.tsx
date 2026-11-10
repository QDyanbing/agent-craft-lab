import AddButton from '@/components/AddButton';
import { onHistoryAnchorChange } from '@/utils/history';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useLocation } from '@tanstack/react-router';
import { Empty, Flex, Grid, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useEditor from '../../models/useEditor';
import ModuleForm from '../ModuleForm';
import ModuleSection from '../ModuleSection';
import Outline from '../Outline';
import QuestionForm from '../QuestionForm';
import styles from './index.module.less';

interface Props {
  survey: API.Questionnaire;
  onDeleteModule: (moduleUuid: string) => Promise<void>;
  onDeleteQuestion: (moduleUuid: string, questionUuid: string) => Promise<void>;
}

const scrollToEntry = (uuid: string) =>
  document.getElementById(uuid)?.scrollIntoView({ block: 'start', inline: 'nearest' });

export default ({ survey, onDeleteModule, onDeleteQuestion }: Props) => {
  const dialog = useEditor((state) => state.dialog);
  const { onOpen, onModuleExpandChange } = useEditor.getState();

  const hash = useLocation({ select: (location) => location.hash });
  const screens = Grid.useBreakpoint();

  const { t } = useTranslation('questionnaireQuestions');

  const moduleUuid = hash
    ? survey.modules.find(
        (module) =>
          module.uuid === hash || module.questions.some((question) => question.uuid === hash),
      )?.uuid
    : undefined;
  const selectedUuid = moduleUuid ? hash : undefined;
  const editingModule = survey.modules.find((module) => module.uuid === dialog?.moduleUuid);
  const editingQuestion =
    dialog?.kind === 'question'
      ? editingModule?.questions.find((question) => question.uuid === dialog.questionUuid)
      : undefined;

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
    if (moduleUuid !== hash) onModuleExpandChange(moduleUuid, true);
    scrollToEntry(hash);
  }, [hash, moduleUuid, onModuleExpandChange]);

  return (
    <Flex vertical gap="middle" className={styles.editor}>
      <Flex vertical gap="small" component="header" className={styles.header}>
        <Typography.Title level={1} className={styles.surveyTitle}>
          {survey.name}
        </Typography.Title>
        {survey.description && (
          <Typography.Text type="secondary">{survey.description}</Typography.Text>
        )}
      </Flex>
      {survey.modules.length > 0 ? (
        <Flex vertical={!screens.md} data-compact={!screens.md} className={styles.workspace}>
          <Outline modules={survey.modules} selectedUuid={selectedUuid} onSelect={onSelect} />
          <Flex vertical gap="large" className={styles.document}>
            {survey.modules.map((module, index) => (
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
            classNames={{ image: styles.emptyIcon }}
            description={
              <Flex vertical gap="small">
                <Typography.Title level={4}>{t('moduleEmpty')}</Typography.Title>
                <Typography.Text type="secondary">{t('firstModule')}</Typography.Text>
              </Flex>
            }
          >
            <AddButton label={t('newModule')} onClick={() => onOpen({ kind: 'module' })} />
          </Empty>
        </Flex>
      )}
      {dialog?.kind === 'module' && <ModuleForm module={editingModule} />}
      {dialog?.kind === 'question' && <QuestionForm question={editingQuestion} />}
    </Flex>
  );
};
