import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Flex,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Tag,
  Typography,
} from 'antd';
import type { RefCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useDelete from '../../hooks/question/useDelete';
import useQuestionSet from '../../models/useQuestionSet';
import styles from './index.module.less';

interface Props {
  moduleUuid: string;
  question: API.IQuestionnaireQuestion;
  number: string;
  isSelected: boolean;
  entryRef: RefCallback<HTMLElement>;
}

export default ({ moduleUuid, question, number, isSelected, entryRef }: Props) => {
  const { onModify } = useQuestionSet();

  const { onDelete } = useDelete();

  const { t } = useTranslation('questionnaireQuestions');

  const Choice = question.type === 'SINGLE' ? Radio : Checkbox;

  return (
    <Flex
      vertical
      gap="small"
      role="group"
      id={question.uuid}
      ref={isSelected ? entryRef : undefined}
      data-current={isSelected}
      aria-label={question.title}
      className={styles.questionItem}
    >
      <Flex gap="small" align="start" justify="space-between">
        <Flex gap="small" align="center" className={styles.content}>
          <Typography.Text strong className={styles.title}>
            {t('numberedTitle', { number, title: question.title })}
          </Typography.Text>
          <Tag variant="filled">{t(question.type.toLowerCase())}</Tag>
        </Flex>
        <Flex align="center" className={styles.actions}>
          <Button
            type="text"
            aria-label={t('editQuestion')}
            title={t('editQuestion')}
            icon={<EditOutlined />}
            onClick={() => onModify(moduleUuid, question)}
          />
          <Popconfirm
            title={t('confirmQuestion')}
            okText={t('confirm')}
            cancelText={t('cancel')}
            onConfirm={() => onDelete(moduleUuid, question.uuid)}
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
      {question.type === 'TEXT' && (
        <Input.TextArea
          disabled
          rows={2}
          aria-label={question.title}
          placeholder={t('textAnswerPlaceholder')}
        />
      )}
      {question.type === 'NUMBER' && <InputNumber disabled aria-label={question.title} />}
      {question.options.length > 0 && (
        <Flex vertical gap="small" align="start">
          {question.options.map((option, index) => (
            <Choice disabled key={index}>
              {option}
            </Choice>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
