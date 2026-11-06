import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginHref, safeNext } from './loginRedirect';

test('an invite link survives signing in', () => {
  assert.equal(
    loginHref('/groups?join=K7P2QX'),
    '/login?next=%2Fgroups%3Fjoin%3DK7P2QX',
  );
  assert.equal(safeNext('/groups?join=K7P2QX'), '/groups?join=K7P2QX');
});

test('only internal paths are followed', () => {
  for (const unsafe of [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'groups',
    '',
    null,
  ]) {
    assert.equal(safeNext(unsafe), '/');
  }
  assert.equal(safeNext('/login?next=/x'), '/');
  assert.equal(loginHref('/'), '/login');
});
