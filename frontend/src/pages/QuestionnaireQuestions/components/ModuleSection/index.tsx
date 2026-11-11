import AddButton from '@/components/AddButton';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Popconfirm, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import useModuleSet from '../../models/useModuleSet';
import useQuestionSet from '../../models/useQuestionSet';
import QuestionItem from '../QuestionItem';
import styles from './index.module.less';

interface Props {
  module: API.IQuestionnaireModule;
  number: number;
  selectedUuid?: string;
  onDeleteModule: (moduleUuid: string) => Promise<void>;
  onDeleteQuestion: (moduleUuid: string, questionUuid: string) => Promise<void>;
}

export default ({ module, number, selectedUuid, onDeleteModule, onDeleteQuestion }: Props) => {
  const { onModify } = useModuleSet.getState();
  const { onCreate, onModify: onModifyQuestion } = useQuestionSet.getState();

  const { t } = useTranslation('questionnaireQuestions');

  return (
    <Flex vertical component="section" aria-label={module.name} className={styles.moduleSection}>
      <Flex
        wrap
        gap="small"
        align="center"
        justify="space-between"
        id={module.uuid}
        data-current={selectedUuid === module.uuid}
        className={styles.heading}
      >
        <Typography.Title level={3} className={styles.title}>
          {module.name}
        </Typography.Title>
        <Flex gap="small" align="center">
          <Button
            type="text"
            title={t('editModule')}
            aria-label={t('editModule')}
            icon={<EditOutlined />}
            onClick={() => onModify(module)}
          />
          <Popconfirm
            title={t('confirmModule')}
            okText={t('confirm')}
            cancelText={t('cancel')}
            onConfirm={() => onDeleteModule(module.uuid)}
          >
            <Button
              danger
              type="text"
              title={t('deleteModule')}
              aria-label={t('deleteModule')}
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
          <AddButton
            label={t('newQuestion')}
            onClick={() => onCreate(module.uuid)}
          />
        </Flex>
      </Flex>
      {module.questions.map((question, index) => (
        <QuestionItem
          key={question.uuid}
          question={question}
          number={`${number}.${index + 1}`}
          selected={selectedUuid === question.uuid}
          onEdit={() =>
            onModifyQuestion(module.uuid, question)
          }
          onDelete={() => onDeleteQuestion(module.uuid, question.uuid)}
        />
      ))}
      {module.questions.length === 0 && (
        <Empty
          image={false}
          description={t('questionEmpty')}
          classNames={{ root: styles.empty, image: styles.emptyImage }}
        />
      )}
    </Flex>
  );
};
