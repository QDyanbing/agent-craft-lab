import languages, { getLanguage } from '@/i18n/languages';
import { DownOutlined, GlobalOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex } from 'antd';
import { useTranslation } from 'react-i18next';

export default () => {
  const { t, i18n } = useTranslation('localeSwitch');
  const { label, locale } = getLanguage(i18n.resolvedLanguage);

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        selectable: true,
        items: languages.map((language) => ({
          key: language.locale,
          label: language.label,
        })),
        selectedKeys: [locale],
        onClick: ({ key }) => void i18n.changeLanguage(key),
      }}
    >
      <Button type="text" icon={<GlobalOutlined />} aria-label={t('label')}>
        <Flex align="center" gap="small" component="span">
          {label}
          <DownOutlined />
        </Flex>
      </Button>
    </Dropdown>
  );
};
