import type { CSSProperties } from 'react';

type CSSVariables = CSSProperties & Record<`--${string}`, string | number>;

const variables: CSSVariables = {
  '--questionnaire-answer-width': '800px',
  '--questionnaire-brand-tracking': '-0.04em',
  '--questionnaire-content-width': '1200px',
  '--questionnaire-cover-bg': '#e5ecdeff',
  '--questionnaire-cover-height': '96px',
  '--questionnaire-editor-header-max-height': '160px',
  '--questionnaire-module-width': '240px',
  '--questionnaire-nav-width': '160px',
  '--search-input-width': '360px',
};

export default variables;
