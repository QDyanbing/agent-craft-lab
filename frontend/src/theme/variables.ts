import type { CSSProperties } from 'react';

type CSSVariables = CSSProperties & Record<`--${string}`, string | number>;

const variables: CSSVariables = {
  '--questionnaire-answer-width': '800px',
  '--layout-header-action-bg-opacity': '16%',
  '--layout-header-height': '56px',
  '--layout-sider-collapsed-width': '80px',
  '--layout-sider-width': '220px',
  '--questionnaire-brand-tracking': '-0.04em',
  '--questionnaire-content-width': '1200px',
  '--questionnaire-cover-bg': '#e5ecdeff',
  '--questionnaire-cover-height': '96px',
  '--questionnaire-editor-header-max-height': '22vh',
  '--questionnaire-outline-compact-max-height': '30vh',
  '--questionnaire-module-width': '240px',
  '--questionnaire-nav-width': '160px',
  '--search-input-width': '360px',
};

export default variables;
