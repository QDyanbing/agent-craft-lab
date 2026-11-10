import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  cssVar: { key: 'questionnaires' },
  token: {
    colorPrimary: '#245c47',
    colorPrimaryBg: '#e9f2e9',
    colorPrimaryBgHover: '#dcebdd',
    colorLink: '#245c47',
    colorText: '#202c26',
    colorTextSecondary: '#56635b',
    colorTextTertiary: '#66736a',
    colorBorder: '#ccd6cc',
    colorBorderSecondary: '#dce3da',
    colorBgLayout: '#f7f8f4',
    borderRadius: 8,
    borderRadiusLG: 14,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  components: {
    Button: { primaryShadow: 'none', defaultShadow: 'none', fontWeight: 500 },
    Table: {
      headerBg: '#f4f6f1',
      headerColor: '#58665c',
      headerSplitColor: 'transparent',
      rowHoverBg: '#f8faf6',
      cellPaddingBlock: 17,
      cellPaddingInline: 20,
    },
    Typography: { titleMarginTop: 0, titleMarginBottom: 0 },
    Tag: { defaultBg: '#edf3ed', defaultColor: '#365d47' },
  },
};

export default theme;
