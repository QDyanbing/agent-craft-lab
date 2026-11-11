import AddButton from '@/components/AddButton';
import { Flex, Tree, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import useModuleSet from '../../models/useModuleSet';
import styles from './index.module.less';

interface Props {
  modules: API.IQuestionnaireModule[];
  selectedUuid?: string;
  onSelect: (uuid: string) => void;
}

const revealSelectedRow = (title: HTMLElement | null) => {
  title?.closest('[role="treeitem"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};

export default ({ modules, selectedUuid, onSelect }: Props) => {
  const { onCreate } = useModuleSet();

  const { t } = useTranslation('questionnaireQuestions');

  const nodes = modules.map((module, index) => ({
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
      <Flex vertical className={styles.body}>
        <Tree
          blockNode
          virtual={false}
          aria-label={t('outline')}
          treeData={nodes}
          defaultExpandAll
          selectedKeys={selectedUuid ? [selectedUuid] : []}
          titleRender={(node) =>
            node.key === selectedUuid ? (
              <Typography.Text ref={revealSelectedRow}>{node.title}</Typography.Text>
            ) : (
              node.title
            )
          }
          onSelect={(_, { node }) => onSelect(node.key)}
        />
      </Flex>
    </Flex>
  );
};
