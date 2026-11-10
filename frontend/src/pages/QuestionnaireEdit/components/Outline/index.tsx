import AddButton from '@/components/AddButton';
import { Flex, Tree, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import useEditor from '../../models/useEditor';
import styles from './index.module.less';

interface Props {
  modules: API.QuestionnaireModule[];
  selectedUuid?: string;
  onSelect: (uuid: string) => void;
}

const revealSelectedRow = (title: HTMLElement | null) => {
  title?.closest('[role="treeitem"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};

export default ({ modules, selectedUuid, onSelect }: Props) => {
  const collapsedModuleUuids = useEditor((state) => state.collapsedModuleUuids);
  const { onOpen, onModuleExpandChange } = useEditor.getState();

  const { t } = useTranslation('questionnaireEdit');

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
        <AddButton label={t('newModule')} onClick={() => onOpen({ kind: 'module' })} />
      </Flex>
      <Flex vertical className={styles.body}>
        <Tree
          blockNode
          virtual={false}
          aria-label={t('outline')}
          treeData={nodes}
          expandedKeys={modules
            .filter((module) => !collapsedModuleUuids.includes(module.uuid))
            .map((module) => module.uuid)}
          selectedKeys={selectedUuid ? [selectedUuid] : []}
          titleRender={(node) =>
            node.key === selectedUuid ? (
              <Typography.Text ref={revealSelectedRow}>{node.title}</Typography.Text>
            ) : (
              node.title
            )
          }
          onExpand={(_, { node, expanded }) => onModuleExpandChange(node.key, expanded)}
          onSelect={(_, { node }) => onSelect(node.key)}
        />
      </Flex>
    </Flex>
  );
};
