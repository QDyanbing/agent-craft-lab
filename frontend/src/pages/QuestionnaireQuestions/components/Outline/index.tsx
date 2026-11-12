import AddButton from '@/components/AddButton';
import { scrollIntoView } from '@/utils/scroll';
import { Flex, Tree, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import useModuleSet from '../../models/useModuleSet';
import styles from './index.module.less';

interface Props {
  data: API.IQuestionnaireModule[];
  selected?: string;
  onSelect: (uuid: string) => void;
}

export default ({ data, selected, onSelect }: Props) => {
  const { onCreate } = useModuleSet();

  const { t } = useTranslation('questionnaireQuestions');

  const nodes = data.map((module, index) => ({
    key: module.uuid,
    title: module.name,
    children: module.questions.map((question, questionIndex) => ({
      key: question.uuid,
      title: t('numberedTitle', {
        number: `${index + 1}.${questionIndex + 1}`,
        title: question.title,
      }),
    })),
  }));

  return (
    <Flex vertical component="nav" aria-label={t('outline')} className={styles.outline}>
      <Flex align="center" justify="space-between" className={styles.header}>
        <Typography.Title level={5}>{t('outline')}</Typography.Title>
        <AddButton label={t('newModule')} onClick={onCreate} />
      </Flex>
      <Tree
        blockNode
        virtual={false}
        aria-label={t('outline')}
        treeData={nodes}
        defaultExpandAll
        selectedKeys={selected ? [selected] : []}
        className={styles.body}
        titleRender={(node) =>
          node.key === selected ? (
            <Typography.Text ref={scrollIntoView}>{node.title}</Typography.Text>
          ) : (
            node.title
          )
        }
        onSelect={(_, { node }) => onSelect(node.key)}
      />
    </Flex>
  );
};
