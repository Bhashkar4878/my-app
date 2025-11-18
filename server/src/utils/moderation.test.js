const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluatePostContent } = require('./moderation');

test('allows neutral content', () => {
  const result = evaluatePostContent('Just enjoying a sunny day with friends.');
  assert.equal(result.isAllowed, true);
  assert.deepEqual(result.reasons, []);
});

test('flags abusive language', () => {
  const result = evaluatePostContent('You are such an idiot for thinking that.');
  assert.equal(result.isAllowed, false);
  assert.ok(result.reasons.some((r) => r.category === 'abuse'));
});

test('flags hate speech terms', () => {
  const result = evaluatePostContent('We should purge everyone who disagrees.');
  assert.equal(result.isAllowed, false);
  assert.ok(result.reasons.some((r) => r.category === 'hate_speech'));
});

test('flags spam indicators', () => {
  const result = evaluatePostContent(
    'Buy now! Click here https://spam.com and visit my profile https://fake.com for free money!!!'
  );
  assert.equal(result.isAllowed, false);
  assert.ok(result.reasons.some((r) => r.category === 'spam'));
});

test('flags misleading phrases', () => {
  const result = evaluatePostContent('Secret government confirms flat earth hidden truth.');
  assert.equal(result.isAllowed, false);
  assert.ok(result.reasons.some((r) => r.category === 'misleading'));
});


