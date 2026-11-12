import LocaleSwitch from '@/components/LocaleSwitch';
import { onHistoryChange } from '@/utils/history';
import { ProfileOutlined, SnippetsOutlined } from '@ant-design/icons';
import { Outlet, useMatches } from '@tanstack/react-router';
import { Avatar, Button, Flex, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './questionnaires.module.less';

export default () => {
  const page = useMatches({ select: (matches): string => matches[matches.length - 1].fullPath });

  const { t } = useTranslation('layout');

  return (
    <Flex vertical className={styles.questionnaires}>
      <Flex component="header" className={styles.header}>
        <Flex align="center" justify="space-between" className={styles.navigation}>
          <Button
            type="text"
            icon={<Avatar shape="square" icon={<SnippetsOutlined />} className={styles.mark} />}
            className={styles.brand}
            onClick={() => onHistoryChange('/questionnaires')}
          >
            {t('questionnaireBrand')}
          </Button>
          <LocaleSwitch />
        </Flex>
      </Flex>
      <Flex className={styles.body}>
        <Flex vertical component="nav" aria-label={t('mainNavigation')}>
          <Menu
            mode="inline"
            items={[
              {
                key: '/questionnaires',
                icon: <ProfileOutlined />,
                label: t('questionnaireList'),
              },
            ]}
            selectedKeys={page === '/questionnaires' ? ['/questionnaires'] : []}
            className={styles.menu}
            onClick={({ key }) => onHistoryChange(key)}
          />
        </Flex>
        <Flex vertical component="main" data-page={page} className={styles.content}>
          <Outlet />
        </Flex>
      </Flex>
    </Flex>
  );
};
