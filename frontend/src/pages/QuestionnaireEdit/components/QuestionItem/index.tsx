import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Popconfirm, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';

interface Props {
  question: API.QuestionnaireQuestion;
  number: string;
  selected: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export default ({ question, number, selected, onEdit, onDelete }: Props) => {
  const { t } = useTranslation('questionnaireEdit');

  return (
    <Flex
      vertical
      gap="small"
      role="group"
      id={question.uuid}
      data-current={selected}
      aria-label={question.title}
      className={styles.questionItem}
    >
      <Flex align="start" justify="space-between" gap="small">
        <Flex wrap align="center" gap="small" className={styles.content}>
          <Typography.Text strong className={styles.title}>
            {t('numberedTitle', { number, title: question.title })}
          </Typography.Text>
          <Tag variant="filled">{t(question.type)}</Tag>
        </Flex>
        <Flex align="center" className={styles.actions}>
          <Button
            type="text"
            aria-label={t('editQuestion')}
            title={t('editQuestion')}
            icon={<EditOutlined />}
            onClick={onEdit}
          />
          <Popconfirm
            title={t('confirmQuestion')}
            okText={t('confirm')}
            cancelText={t('cancel')}
            onConfirm={onDelete}
          >
            <Button
              danger
              type="text"
              aria-label={t('deleteQuestion')}
              title={t('deleteQuestion')}
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Flex>
      </Flex>
      {question.description && (
        <Typography.Text type="secondary">{question.description}</Typography.Text>
      )}
      {question.type === 'text' && (
        <Input.TextArea
          disabled
          rows={2}
          aria-label={question.title}
          placeholder={t('textAnswerPlaceholder')}
        />
      )}
      {question.options.length > 0 && (
        <Flex vertical gap="small" component="ul" className={styles.options}>
          {question.options.map((option, index) => (
            <Flex
              key={index}
              component="li"
              gap="small"
              data-type={question.type}
              className={styles.option}
            >
              {option}
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
