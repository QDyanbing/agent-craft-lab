import { Button, Flex, Input, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import useDialog from '../../models/useDialog';
import usePage from '../../models/usePage';
import styles from './index.module.less';

export default ({ total }: { total?: number }) => {
  const { onOpen } = useDialog.getState();
  const { params, onSearch } = usePage();
  const { t } = useTranslation('questionnaire');

  return (
    <Flex vertical gap="middle" className={styles.searchBar}>
      <Flex vertical align="start" justify="center" component="header" className={styles.cover}>
        <Flex vertical gap="small" className={styles.intro}>
          <Typography.Title level={1} className={styles.title}>
            {t('title')}
          </Typography.Title>
          {total !== undefined && (
            <Typography.Text type="secondary">
              {total || params.keyword ? t('total', { count: total }) : t('first')}
            </Typography.Text>
          )}
        </Flex>
      </Flex>
      <Flex align="center" justify="space-between" gap="small">
        <Flex className={styles.search}>
          <Input.Search
            allowClear
            defaultValue={params.keyword}
            aria-label={t('searchKeyword')}
            placeholder={t('searchKeyword')}
            onSearch={onSearch}
          />
        </Flex>
        <Flex>
          <Button type="primary" onClick={() => onOpen()}>
            {t('create')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
