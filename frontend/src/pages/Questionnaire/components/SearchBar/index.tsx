import { Button, Flex, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import useDialog from '../../models/useDialog';
import usePage from '../../models/usePage';
import styles from './index.module.less';

export default () => {
  const { params, onSearch } = usePage();
  const { onOpen } = useDialog.getState();

  const { t } = useTranslation('questionnaire');

  return (
    <Flex gap="small" align="center" justify="space-between" className={styles.searchBar}>
      <Flex className={styles.search}>
        <Input.Search
          allowClear
          defaultValue={params.keyword}
          aria-label={t('search.keyword')}
          placeholder={t('search.keyword')}
          onSearch={onSearch}
        />
      </Flex>
      <Flex>
        <Button type="primary" onClick={() => onOpen()}>
          {t('action.create')}
        </Button>
      </Flex>
    </Flex>
  );
};
