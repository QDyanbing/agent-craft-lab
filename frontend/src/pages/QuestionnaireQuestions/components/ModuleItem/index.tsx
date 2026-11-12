import AddButton from '@/components/AddButton';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Popconfirm, Typography } from 'antd';
import type { RefCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useDelete from '../../hooks/module/useDelete';
import useModuleSet from '../../models/useModuleSet';
import useQuestionSet from '../../models/useQuestionSet';
import QuestionItem from '../QuestionItem';
import styles from './index.module.less';

interface Props {
  data: API.IQuestionnaireModule;
  number: number;
  selected?: string;
  entryRef: RefCallback<HTMLElement>;
}

export default ({ data, number, selected, entryRef }: Props) => {
  const { onModify } = useModuleSet();
  const { onCreate } = useQuestionSet();

  const { onDelete } = useDelete();

  const { t } = useTranslation('questionnaireQuestions');

  return (
    <Flex vertical component="section" aria-label={data.name} className={styles.moduleItem}>
      <Flex
        gap="small"
        align="center"
        justify="space-between"
        id={data.uuid}
        ref={selected === data.uuid ? entryRef : undefined}
        data-current={selected === data.uuid}
        className={styles.heading}
      >
        <Typography.Title level={4}>{data.name}</Typography.Title>
        <Flex gap="small" align="center">
          <Button
            type="text"
            title={t('editModule')}
            aria-label={t('editModule')}
            icon={<EditOutlined />}
            onClick={() => onModify(data)}
          />
          <Popconfirm
            title={t('confirmModule')}
            okText={t('confirm')}
            cancelText={t('cancel')}
            onConfirm={() => onDelete(data.uuid)}
          >
            <Button
              danger
              type="text"
              title={t('deleteModule')}
              aria-label={t('deleteModule')}
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
          <AddButton label={t('newQuestion')} onClick={() => onCreate(data.uuid)} />
        </Flex>
      </Flex>
      {data.questions.map((question, index) => (
        <QuestionItem
          key={question.uuid}
          moduleUuid={data.uuid}
          question={question}
          number={`${number}.${index + 1}`}
          isSelected={selected === question.uuid}
          entryRef={entryRef}
        />
      ))}
      {data.questions.length === 0 && (
        <Empty
          image={false}
          description={t('questionEmpty')}
          classNames={{ root: styles.empty, image: styles.emptyImage }}
        />
      )}
    </Flex>
  );
};
