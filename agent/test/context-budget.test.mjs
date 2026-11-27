import assert from 'node:assert/strict';
import test from 'node:test';
import * as budget from '../src/context/budget.ts';

const { shouldCompact } = budget;
const threshold = 837_837;

test('预算模块只公开 shouldCompact', () => {
  assert.deepEqual(Object.keys(budget), ['shouldCompact']);
});

test('没有追加消息时，直接按上一轮用量判断边界', () => {
  assert.equal(shouldCompact(0, []), false);
  assert.equal(shouldCompact(threshold - 1, []), false);
  assert.equal(shouldCompact(threshold, []), true);
  assert.equal(shouldCompact(threshold + 1, []), true);
});

test('只估算正文，每条按 UTF-8 字节数除以 4 向上取整', () => {
  for (const [content, tokens] of [['', 0], ['abcd', 1], ['abcde', 2], ['继续', 2], ['😀', 1]]) {
    const messages = [{ role: 'user', content }];
    assert.equal(shouldCompact(threshold - tokens - 1, messages), false);
    assert.equal(shouldCompact(threshold - tokens, messages), true);
  }
});

test('两条各 1 字节的消息分别取整，合计 2 个 token', () => {
  const messages = [{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }];
  assert.equal(shouldCompact(threshold - 3, messages), false);
  assert.equal(shouldCompact(threshold - 2, messages), true);
});

test('拒绝无效的上一轮 token 数', () => {
  for (const count of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => shouldCompact(count, []), RangeError);
  }
});
