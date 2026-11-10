import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  back: vi.fn(),
  canGoBack: vi.fn(),
  navigate: vi.fn(),
  open: vi.fn(),
}));

vi.mock('@config/router', () => ({
  router: {
    history: {
      back: mocks.back,
      canGoBack: mocks.canGoBack,
    },
    navigate: mocks.navigate,
  },
}));

import { onHistoryBack, onHistoryChange, onHistoryReplace, onOpenTab } from './history';

describe('页面跳转', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', { open: mocks.open });
  });

  test('新增或替换浏览器历史记录', () => {
    const search = { uuid: 'questionnaire-id' };

    onHistoryChange('/questionnaires/questions', search);
    onHistoryReplace('/questionnaires');

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, {
      to: '/questionnaires/questions',
      search,
    });
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, {
      to: '/questionnaires',
      search: undefined,
      replace: true,
    });
  });

  test('存在历史记录时返回上一页', () => {
    mocks.canGoBack.mockReturnValue(true);

    onHistoryBack('/questionnaires');

    expect(mocks.back).toHaveBeenCalledOnce();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  test('不存在历史记录时替换为兜底页面', () => {
    mocks.canGoBack.mockReturnValue(false);

    onHistoryBack('/questionnaires');

    expect(mocks.navigate).toHaveBeenCalledWith({ to: '/questionnaires', replace: true });
    expect(mocks.back).not.toHaveBeenCalled();
  });

  test('在新标签页打开页面', () => {
    onOpenTab('/questionnaires/questions?uuid=questionnaire-id');

    expect(mocks.open).toHaveBeenCalledWith(
      '/questionnaires/questions?uuid=questionnaire-id',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
