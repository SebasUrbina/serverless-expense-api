import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginHref, safeNext } from './loginRedirect';

test('an invite link survives signing in', () => {
  assert.equal(
    loginHref('/groups?join=K7P2QX'),
    '/login?next=%2Fgroups%3Fjoin%3DK7P2QX',
  );
  assert.equal(safeNext('/groups?join=K7P2QX'), '/groups?join=K7P2QX');
  assert.equal(
    safeNext('/groups?id=3&month=2026-11#x'),
    '/groups?id=3&month=2026-11#x',
  );
});

test('only internal paths are followed', () => {
  for (const unsafe of [
    'https://evil.example',
    'https:evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    '/\r\n/evil.example',
    '/\u0000/evil.example',
    '/\u007F/evil.example',
    'groups',
    '',
    null,
  ]) {
    assert.equal(safeNext(unsafe), '/', JSON.stringify(unsafe));
  }
  assert.equal(safeNext('/login?next=/x'), '/');
  assert.equal(safeNext('/login'), '/');
  assert.equal(safeNext('/groups/../login'), '/');
  assert.equal(loginHref('/'), '/login');
});

test('encoded tricks arrive decoded from the login address and are rejected', () => {
  for (const encoded of [
    '%2F%09%2Fevil.example',
    '%2F%0A%2Fevil.example',
    '%2F%5Cevil.example',
    '%2F%2Fevil.example',
    'https%3A%2F%2Fevil.example',
  ]) {
    const next = new URLSearchParams(`next=${encoded}`).get('next');
    assert.equal(safeNext(next), '/', encoded);
  }
});
