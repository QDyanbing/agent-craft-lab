import LocaleSwitch from '@/components/LocaleSwitch';
import theme from '@/theme/questionnaire';
import { onHistoryChange } from '@/utils/history';
import { getToken } from '@/utils/token';
import { ProfileOutlined, SnippetsOutlined } from '@ant-design/icons';
import { Outlet, useMatches } from '@tanstack/react-router';
import { Avatar, Button, ConfigProvider, Flex, Grid, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './questionnaires.module.less';

export default () => {
  const screens = Grid.useBreakpoint();
  const page = useMatches({ select: (matches): string => matches[matches.length - 1].fullPath });

  const { t } = useTranslation('layout');

  return (
    <ConfigProvider theme={theme}>
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
            <Flex align="center" gap="small">
              {getToken() && (
                <Button type="text" onClick={() => onHistoryChange('/profile')}>
                  {t('profile')}
                </Button>
              )}
              <LocaleSwitch />
            </Flex>
          </Flex>
        </Flex>
        <Flex vertical={!screens.lg} className={styles.body}>
          <Flex vertical component="nav" aria-label={t('mainNavigation')}>
            <Menu
              mode={screens.lg ? 'inline' : 'horizontal'}
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
    </ConfigProvider>
  );
};
