import { randomUUID } from 'node:crypto';
import { expect, test } from '../fixtures';
import { getPaginationTotal } from '../helpers/pagination';

const created = new Set<string>();

test.afterAll(async ({ request }) => {
  for (const uuid of created) {
    const response = await request.delete(`/api/questionnaires/${uuid}`);
    expect(response.ok()).toBe(true);
    expect(await response.json()).toMatchObject({ success: true });
  }
});

test.use({ storageState: { cookies: [], origins: [] } });

test('关键词搜索后翻页，切换关键词回到第一页', async ({ page, request }) => {
  const keyword = randomUUID();
  for (let index = 0; index < 11; index++) {
    const response = await request.post('/api/questionnaires', {
      data: { name: `${keyword}-${index}`, description: index === 10 ? `描述-${keyword}` : '' },
    });
    expect(response.status()).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
    created.add(result.data.uuid);
  }
  await page.setViewportSize({ width: 1120, height: 560 });
  await page.goto('/questionnaires');
  const search = page.getByPlaceholder('搜索问卷名称或描述');
  await search.fill(keyword);
  await search.press('Enter');
  await expect(getPaginationTotal(page, 11)).toBeVisible();
  const header = page.getByRole('columnheader', { name: '文件名称' });
  const controls = [
    header,
    search,
    page.getByRole('button', { name: '创建问卷' }),
    getPaginationTotal(page, 11),
  ];
  const positions = () => Promise.all(controls.map((control) => control.boundingBox()));
  const beforeScroll = await positions();
  const first = page.getByRole('cell', { name: `${keyword}-10`, exact: true });
  const last = page.getByRole('cell', { name: `${keyword}-1`, exact: true });
  await expect(first).toBeInViewport();
  await expect(last).not.toBeInViewport();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  await expect(first).not.toBeInViewport();
  expect(await positions()).toEqual(beforeScroll);
  await page.getByTitle('2', { exact: true }).click();
  await expect(page.getByRole('cell', { name: `${keyword}-0`, exact: true })).toBeVisible();
  await search.fill(`描述-${keyword}`);
  await search.press('Enter');
  await expect(getPaginationTotal(page, 1)).toBeVisible();
  await expect(page.getByRole('cell', { name: `${keyword}-10`, exact: true })).toBeVisible();
  const dialog = page.getByRole('dialog');
  await page.getByRole('button', { name: '创建问卷' }).click();
  await dialog.getByLabel('文件名称').fill(` ${keyword}-0 `);
  await dialog.getByRole('button', { name: /创\s*建/ }).click();
  await expect(dialog.getByText('问卷名称已存在，请换一个名称')).toBeVisible();
  await dialog.getByRole('button', { name: /取\s*消/ }).click();
  await page
    .getByRole('row')
    .filter({ has: first })
    .getByRole('button', { name: /编\s*辑/ })
    .click();
  await dialog.getByLabel('文件名称').fill(`${keyword}-0`);
  await dialog.getByRole('button', { name: /保\s*存/ }).click();
  await expect(dialog.getByText('问卷名称已存在，请换一个名称')).toBeVisible();
  await dialog.getByRole('button', { name: /取\s*消/ }).click();
  await search.fill(`不存在-${keyword}`);
  await search.press('Enter');
  await expect(page.getByText('没有匹配的问卷')).toBeVisible();
  await expect(getPaginationTotal(page, 0)).toBeVisible();
  await search.fill('');
  await search.press('Enter');
  await expect(page.getByRole('cell', { name: `${keyword}-10`, exact: true })).toBeVisible();
});

test('创建问卷，维护模块和四种题型，刷新后回显', async ({ page }) => {
  const name = `学习调查-${randomUUID()}`;
  const dialog = page.getByRole('dialog');
  const outline = page.getByRole('navigation', { name: '问卷大纲' });
  const course = page.getByRole('region', { name: '课程评价', exact: true });
  const save = dialog.getByRole('button', { name: /保\s*存/ });
  await page.goto('/');
  await page.getByRole('button', { name: '创建问卷', exact: true }).click();
  await dialog.getByLabel('文件名称').fill(name);
  await dialog.getByLabel('问卷描述').fill('课程反馈');
  const createResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/questionnaires',
  );
  await dialog.getByRole('button', { name: /创\s*建/ }).click();
  const response = await createResponse;
  expect(response.status()).toBe(201);
  const result: API.SuccessResult<API.QuestionnaireCreated> = await response.json();
  expect(result.success).toBe(true);
  created.add(result.data.uuid);
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('尚未添加模块')).toBeVisible();

  for (const module of ['基本信息', '课程反馈模块']) {
    await page.getByRole('button', { name: '新增模块' }).click();
    await dialog.getByLabel('模块名称').fill(module);
    await save.click();
    await expect(outline.getByRole('treeitem', { name: new RegExp(module) })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }
  await page
    .getByRole('region', { name: '课程反馈模块', exact: true })
    .getByRole('button', { name: '编辑模块' })
    .click();
  await expect(dialog.getByLabel('模块名称')).toHaveValue('课程反馈模块');
  await dialog.getByLabel('模块名称').fill('课程评价');
  await save.click();
  await expect(outline.getByRole('treeitem', { name: /课程评价/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  const moduleEntry = outline.getByRole('treeitem', { name: /课程评价/ });
  const questionEntry = outline.getByRole('treeitem', { name: '2.1 单选题', exact: true });
  const lastEntry = outline.getByRole('treeitem', { name: '2.4 数字题', exact: true });
  const lastQuestion = course.getByRole('group', { name: '数字题', exact: true });
  for (const type of ['单选', '多选', '文本', '数字']) {
    if (type === '数字') {
      await moduleEntry.getByRole('img', { name: 'caret-down' }).click();
      await expect(moduleEntry).toHaveAttribute('aria-expanded', 'false');
      await expect(questionEntry).toHaveCount(0);
      await expect(course.getByRole('group')).toHaveCount(3);
      await page.setViewportSize({ width: 640, height: 600 });
    }
    await course.getByRole('button', { name: '新增题目' }).click();
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: type, exact: true }).click();
    await dialog.getByLabel('标题').fill(`${type}题`);
    await dialog.getByLabel('描述').fill(`${type}说明`);
    if (type === '单选' || type === '多选') {
      await dialog.getByRole('textbox', { name: '选项 1' }).fill('线上');
      await dialog.getByRole('textbox', { name: '选项 2' }).fill('线下');
    } else {
      await expect(dialog.getByRole('textbox', { name: '选项 1' })).toHaveCount(0);
    }
    await save.click();
    await expect(page.getByRole('group', { name: `${type}题` })).toContainText(`${type}说明`);
  }
  await expect(moduleEntry).toHaveAttribute('aria-expanded', 'true');
  await expect(lastEntry).toHaveAttribute('aria-selected', 'true');
  await expect(lastEntry).toBeInViewport({ ratio: 1 });
  await expect(lastQuestion).toHaveAttribute('id', new URL(page.url()).hash.slice(1));

  await page.setViewportSize({ width: 840, height: 380 });
  const saved = new URL(page.url());
  await page.goto(`/Questionnaires/Edit${saved.search}${saved.hash}`);
  await expect(lastQuestion).toBeInViewport();
  await expect(outline.getByRole('heading')).toBeInViewport();
  const basics = page.getByRole('region', { name: '基本信息', exact: true });
  await expect(basics.getByText('这个模块尚无题目')).toBeVisible();
  await expect(course.getByRole('group')).toHaveCount(4);
  const textAnswer = course.getByRole('textbox', { name: '文本题', exact: true });
  await expect(textAnswer).toBeVisible();
  await expect(textAnswer).toBeDisabled();
  const single = course.getByRole('group', { name: '单选题' });
  const firstHeading = basics.getByRole('heading');
  await expect(firstHeading).not.toBeInViewport();
  await outline.getByRole('treeitem', { name: /基本信息/ }).click();
  await expect(firstHeading).toBeInViewport();
  await expect(lastQuestion).not.toBeInViewport();
  await lastEntry.click();
  await expect(lastQuestion).toBeInViewport();
  await expect(single).not.toBeInViewport();
  await questionEntry.click();
  await expect(questionEntry).toHaveAttribute('aria-selected', 'true');
  await expect(single).toBeInViewport();
  await expect(single).toHaveAttribute('id', new URL(page.url()).hash.slice(1));
  await page.reload();
  await expect(questionEntry).toHaveAttribute('aria-selected', 'true');
  await expect(single).toBeInViewport();
  await expect(basics).toBeAttached();
  await expect(single.getByRole('listitem')).toHaveText(['线上', '线下']);
  await page.setViewportSize({ width: 1100, height: 800 });
  await single.getByRole('button', { name: '编辑题目' }).click();
  await expect(dialog.getByRole('textbox', { name: '选项 2' })).toHaveValue('线下');
  await dialog.getByRole('combobox').click();
  await page.getByRole('option', { name: '文本', exact: true }).click();
  await dialog.getByLabel('标题').fill('补充建议');
  await save.click();
  const updated = page.getByRole('group', { name: '补充建议' });
  await expect(updated).toContainText('文本');
  await expect(updated.getByRole('textbox', { name: '补充建议' })).toBeVisible();
  await expect(updated.getByRole('listitem')).toHaveCount(0);
  await updated.getByRole('button', { name: '删除题目' }).click();
  await page.getByRole('button', { name: /^删\s*除$/ }).click();
  await expect(updated).toHaveCount(0);
  await page.getByRole('menuitem', { name: '问卷列表' }).click();
  await expect(page).toHaveURL('/questionnaires');
  const row = page.getByRole('row').filter({ hasText: name });
  const actions = /编\s*辑\s*改\s*题\s*答\s*题\s*删\s*除/;
  await expect(row.getByRole('cell')).toHaveText([name, '课程反馈', '2', '3', actions]);
  await row.getByRole('button', { name: /编\s*辑/ }).click();
  await expect(dialog.getByLabel('文件名称')).toHaveValue(name);
  await expect(dialog.getByLabel('问卷描述')).toHaveValue('课程反馈');
  const newName = `${name}-更新`;
  await dialog.getByLabel('文件名称').fill(newName);
  await dialog.getByLabel('问卷描述').fill('');
  await save.click();
  await expect(row.getByRole('cell')).toHaveText([newName, '', '2', '3', actions]);
  await row.getByRole('button', { name: '答题' }).click();
  await expect(page.getByRole('heading', { name: newName, exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: '线上' }).check();
  await page.getByRole('textbox', { name: /文本题/ }).fill('很有帮助');
  await page.getByRole('spinbutton', { name: /数字题/ }).fill('0');
  await page.getByRole('button', { name: '提交答卷' }).click();
  await expect(page.getByText('答卷已提交')).toBeVisible();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /改\s*题/ }).click();
  await outline.getByRole('treeitem', { name: /课程评价/ }).click();
  await course.getByRole('button', { name: '删除模块' }).click();
  await page.getByRole('button', { name: /^删\s*除$/ }).click();
  await expect(outline.getByRole('treeitem', { name: /课程评价/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'CraftLab' }).click();
  await expect(row.getByRole('cell')).toHaveText([newName, '', '1', '0', actions]);
  await expect(row.getByRole('button', { name: '答题' })).toBeDisabled();
  await row.getByRole('button', { name: /删\s*除/ }).click();
  await page.getByRole('button', { name: /取\s*消/ }).click();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /删\s*除/ }).click();
  await page
    .getByRole('tooltip')
    .getByRole('button', { name: /删\s*除/ })
    .click();
  await expect(row).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible();
  await expect(row).toHaveCount(0);
  created.delete(result.data.uuid);
});
