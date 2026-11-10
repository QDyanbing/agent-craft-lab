import { expect, test } from './fixtures';

test('切换语言后在刷新时保持', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '切换语言' }).click();
  await page.getByText('English', { exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Questionnaires' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.getByRole('button', { name: 'Create questionnaire' })).toBeVisible();
});

test('未知地址进入 404 并可返回问卷列表', async ({ page }) => {
  await page.goto('/unknown-page');
  await expect(page).toHaveURL('/404');
  await expect(page.getByText('页面不存在', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '返回首页' }).click();
  await expect(page).toHaveURL('/questionnaires');
  await expect(page.getByRole('heading', { name: '问卷管理' })).toBeVisible();
});
