import test from 'node:test';
import assert from 'node:assert/strict';
import { getChatbotResponse, getLocalFeatureResponse } from '../src/services/chatbot.js';

test('returns the matching Python learning roadmap', () => {
  const answer = getChatbotResponse('How do I start learning Python?');
  assert.match(answer, /Python learning roadmap/);
  assert.match(answer, /Conditionals and loops/);
});

test('answers supported programming topics specifically', () => {
  const prompts = [
    ['Explain Java to me', /Java is a strongly typed/],
    ['What is a linked list?', /nodes/],
    ['How do arrays work?', /index/],
    ['What is a for loop?', /repeats a block/],
    ['What is a function?', /reusable block/],
    ['Explain OOP', /Object-oriented programming/],
    ['What is Git?', /version-control tool/],
    ['How is GitHub different from Git?', /GitHub hosts Git repositories/],
  ];
  for (const [prompt, expected] of prompts) assert.match(getChatbotResponse(prompt), expected, prompt);
});

test('recommends projects by level', () => {
  assert.match(getChatbotResponse('Suggest a beginner coding project'), /Beginner project ideas/);
  assert.match(getChatbotResponse('Give me an advanced project idea'), /Advanced project ideas/);
});

test('unrelated uses of broad words do not trigger a wrong FAQ', () => {
  assert.match(getChatbotResponse('When does my Java loop stop?'), /A loop repeats/);
  assert.match(getChatbotResponse('What time is the next workshop?'), /Coming up:/);
  assert.match(getChatbotResponse('What is the weather today?'), /not sure how to answer/);
});

test('empty input receives a clear prompt', () => {
  assert.match(getChatbotResponse('   '), /Type a question/);
});

test('structured local features are kept separate from generative coding questions', () => {
  assert.match(getLocalFeatureResponse('Show me a Python roadmap'), /Python learning roadmap/);
  assert.match(getLocalFeatureResponse('Suggest a beginner project'), /Beginner project ideas/);
  assert.equal(getLocalFeatureResponse('Why are Python dictionaries useful?'), null);
});
