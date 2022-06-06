import { defaultEditorState } from './types';
import _ from 'lodash';
import {
  copy,
  copySelectionText,
  cut,
  deleteSelection,
  deleteSomething,
  insertParagraphBreak,
  paste,
  ClipboardDocument,
  reassignParagraph,
  renameSpeaker,
  setText,
} from './edit';
import JSZip from 'jszip';
import { Document, getEmptyDocument, serializeDocument } from '../../core/document';
import { mocked } from 'jest-mock';
import { clipboard } from 'electron';
import { addUuids } from '../../util/test_helper';
import { runAsyncThunkSync } from '../../util/reducer_test_helper';

test('insert paragraph break user cursor', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  state.cursor.current = 'user';
  state.cursor.userIndex = 2;
  insertParagraphBreak.reducer(state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(4);
  expect(state.document.content).toBeValidDocumentContent();
});

test('insert paragraph break: player cursor in first 50%', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  state.cursor.current = 'player';
  state.cursor.playerTime = 1.2;
  insertParagraphBreak.reducer(state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(4);
  expect(state.document.content).toBeValidDocumentContent();
});

test('insert paragraph break: player cursor in last 50%', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  state.cursor.current = 'player';
  state.cursor.playerTime = 1.75;
  insertParagraphBreak.reducer(state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(5);
  expect(state.document.content).toBeValidDocumentContent();
});

test('insert paragraph break: non-text item', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  state.cursor.current = 'player';
  state.cursor.playerTime = 1;
  insertParagraphBreak.reducer(state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(6);
  expect(state.document.content).toBeValidDocumentContent();
});

const testContentSingleParaSingleWord = addUuids([
  { type: 'paragraph_start', speaker: 'Speaker One', language: null },
  { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
  { type: 'paragraph_break' },
]);

test.each([0, 1])('insert paragraph break: before first para break, at idx=%ds', (index) => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(testContentSingleParaSingleWord);
  state.cursor.current = 'user';
  state.cursor.userIndex = index;
  insertParagraphBreak.reducer(state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(3);
  expect(state.document.content).toBeValidDocumentContent();
});

test('delete selection with no selection is noop', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(testContentSingleParaSingleWord);
  deleteSelection.reducer(state);
  expect(state.document.content).toStrictEqual(testContentSingleParaSingleWord);
  expect(state.selection).toBe(null);
  expect(state.document.content).toBeValidDocumentContent();
});

test('delete selection: 1 text', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(testContentSingleParaSingleWord);
  state.selection = { startIndex: 1, length: 1, headPosition: 'left' };
  deleteSelection.reducer(state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'paragraph_break' },
  ]);
  expect(state.selection).toBe(null);
  expect(state.document.content).toBeValidDocumentContent();
});

test('delete selection: more texts', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  state.selection = { startIndex: 1, length: 2, headPosition: 'left' };
  deleteSelection.reducer(state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'paragraph_break' },
  ]);
  expect(state.selection).toBe(null);
  expect(state.document.content).toBeValidDocumentContent();
});

test('delete selection: keeps first paragraph start', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  state.selection = { startIndex: 0, length: 2, headPosition: 'left' };
  deleteSelection.reducer(state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.selection).toBe(null);
  expect(state.document.content).toBeValidDocumentContent();
});

test('delete selection: keeps default para', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.selection = { startIndex: 0, length: 2, headPosition: 'left' };
  deleteSelection.reducer(state);
  expect(state.document).toBeSameDocumentExceptUuids(getEmptyDocument());
  expect(state.selection).toBe(null);
  expect(state.document.content).toBeValidDocumentContent();
});

test('set text', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(testContentSingleParaSingleWord);
  setText.reducer(state, { text: 'text', absoluteIndex: 1 });
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'text', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.content).toBeValidDocumentContent();
});

test('set text: idx is not a text', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(testContentSingleParaSingleWord);
  expect(() => {
    setText.reducer(state, { text: 'text', absoluteIndex: 0 });
  }).toThrow(/not a text/i);
  expect(state.document.content).toBeValidDocumentContent();
});

test('reassign paragraph', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(testContentSingleParaSingleWord);
  reassignParagraph.reducer(state, { newSpeaker: 'Speaker Two', absoluteIndex: 0 });
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.content).toBeValidDocumentContent();
});

test('reassign paragraph: idx is not a para break', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(testContentSingleParaSingleWord);
  expect(() => {
    reassignParagraph.reducer(state, { newSpeaker: 'Speaker Two', absoluteIndex: 1 });
  }).toThrow(/not a paragraph_start/i);
  expect(state.document.content).toBeValidDocumentContent();
});

test('rename speaker', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  renameSpeaker.reducer(state, { newName: 'Speaker Two', oldName: 'Speaker One' });
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.content).toBeValidDocumentContent();
});

test('rename speaker: more than one speaker in document', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  renameSpeaker.reducer(state, { newName: 'Speaker Three', oldName: 'Speaker One' });
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker Three', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.content).toBeValidDocumentContent();
});

const documentContentTwoParaTwoSpeaker = addUuids([
  { type: 'paragraph_start', speaker: 'Speaker One', language: null },
  { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
  { type: 'paragraph_break' },
  { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
  { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
  { type: 'paragraph_break' },
]);
test('rename speaker: speaker not in document', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  renameSpeaker.reducer(state, { newName: 'Speaker Three', oldName: 'Speaker Ten' });
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.content).toBeValidDocumentContent();
});

test.each(['left', 'right'])('delete something: selection %s', (direction: 'left' | 'right') => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.selection = {
    headPosition: 'left',
    startIndex: 1,
    length: 3,
  };
  deleteSomething.reducer(state, direction);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(1);
  expect(state.selection).toBe(null);
  expect(state.document.content).toBeValidDocumentContent();
});

test.each([
  { index: 3, itemType: 'break', direction: 'left' },
  { index: 2, itemType: 'break', direction: 'right' },
  { index: 4, itemType: 'start', direction: 'left' },
  { index: 3, itemType: 'start', direction: 'right' },
] as { index: number; itemType: string; direction: 'left' | 'right' }[])(
  'delete something: para $itemType; $direction',
  ({ index, direction }: { index: number; direction: 'left' | 'right' }) => {
    const state = _.cloneDeep(defaultEditorState);
    state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
    state.cursor.current = 'user';
    state.cursor.userIndex = index;
    deleteSomething.reducer(state, direction);
    expect(state.document.content).toStrictEqualExceptUuids([
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
      { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
      { type: 'paragraph_break' },
    ]);
    expect(state.cursor.current).toBe('user');
    expect(state.cursor.userIndex).toBe(2);
    expect(state.selection).toBe(null);
    expect(state.document.content).toBeValidDocumentContent();
  }
);

test.each([
  { index: 2, direction: 'left' },
  { index: 1, direction: 'right' },
] as { index: number; direction: 'left' | 'right' }[])(
  'delete something: text; $direction',
  ({ direction, index }) => {
    const state = _.cloneDeep(defaultEditorState);
    state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
    state.cursor.current = 'user';
    state.cursor.userIndex = index;
    deleteSomething.reducer(state, direction);
    expect(state.document.content).toStrictEqualExceptUuids(documentContentTwoParaTwoSpeaker);
    expect(state.selection).toStrictEqual({ headPosition: direction, startIndex: 1, length: 1 });
    deleteSomething.reducer(state, direction);
    expect(state.document.content).toStrictEqualExceptUuids([
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'paragraph_break' },
      { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
      { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
      { type: 'paragraph_break' },
    ]);
    expect(state.selection).toStrictEqual(null);
    expect(state.cursor.current).toBe('user');
    expect(state.cursor.userIndex).toBe(1);
    expect(state.document.content).toBeValidDocumentContent();
  }
);

test.each(['left', 'right'])('delete something: %s at idx=0', (direction: 'left' | 'right') => {
  const state = _.cloneDeep(defaultEditorState);
  state.cursor.current = 'user';
  state.cursor.userIndex = 0;
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  deleteSomething.reducer(state, direction);
  expect(state.document.content).toStrictEqualExceptUuids(documentContentTwoParaTwoSpeaker);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(0);
  expect(state.document.content).toBeValidDocumentContent();
});

test.each([
  { index: 0, direction: 'right' },
  { index: 1, direction: 'left' },
])(
  'delete something: $direction doesnt delete first para',
  ({ index, direction }: { index: number; direction: 'left' | 'right' }) => {
    const state = _.cloneDeep(defaultEditorState);
    state.cursor.current = 'user';
    state.cursor.userIndex = index;
    state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
    deleteSomething.reducer(state, direction);
    deleteSomething.reducer(state, direction);
    expect(state.document.content).toStrictEqualExceptUuids(documentContentTwoParaTwoSpeaker);
    expect(state.cursor.current).toBe('user');
    expect(state.cursor.userIndex).toBe(index);
    expect(state.document.content).toBeValidDocumentContent();
  }
);

test('delete something: text; left; player cursor at end of text', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.cursor.current = 'player';
  state.cursor.playerTime = 1;
  deleteSomething.reducer(state, 'left');
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.selection).toStrictEqual(null);
  expect(state.document.content).toBeValidDocumentContent();
});

test('delete something: text; right; player cursor at end of text', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.cursor.current = 'player';
  state.cursor.playerTime = 1;
  deleteSomething.reducer(state, 'right');
  expect(state.document.content).toStrictEqual(documentContentTwoParaTwoSpeaker);
  expect(state.selection).toStrictEqual({ headPosition: 'right', startIndex: 4, length: 1 });
  deleteSomething.reducer(state, 'right');
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'paragraph_break' },
  ]);
  expect(state.selection).toStrictEqual(null);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(4);
  expect(state.document.content).toBeValidDocumentContent();
});

test.each(['left', 'right'])(
  'delete something: text; %s; player cursor in text',
  (direction: 'left' | 'right') => {
    const state = _.cloneDeep(defaultEditorState);
    state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
    state.cursor.current = 'player';
    state.cursor.playerTime = 0.5;
    deleteSomething.reducer(state, direction);
    expect(state.document.content).toStrictEqualExceptUuids(documentContentTwoParaTwoSpeaker);
    expect(state.selection).toStrictEqual({ headPosition: direction, startIndex: 1, length: 1 });
    deleteSomething.reducer(state, direction);
    expect(state.document.content).toStrictEqualExceptUuids([
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'paragraph_break' },
      { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
      { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
      { type: 'paragraph_break' },
    ]);
    expect(state.selection).toStrictEqual(null);
    expect(state.cursor.current).toBe('user');
    expect(state.cursor.userIndex).toBe(1);
    expect(state.document.content).toBeValidDocumentContent();
  }
);

test('delete something: left at t=0', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.cursor.current = 'player';
  state.cursor.playerTime = 0;
  deleteSomething.reducer(state, 'left');
  deleteSomething.reducer(state, 'left');
  expect(state.document.content).toStrictEqualExceptUuids(documentContentTwoParaTwoSpeaker);
  expect(state.cursor.current).toBe('player');
  expect(state.cursor.userIndex).toBe(0);
  expect(state.document.content).toBeValidDocumentContent();
});

test('delete something: right at t=0', () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.cursor.current = 'player';
  state.cursor.playerTime = 0;
  deleteSomething.reducer(state, 'right');
  expect(state.document.content).toStrictEqualExceptUuids(documentContentTwoParaTwoSpeaker);
  expect(state.selection).toStrictEqual({ headPosition: 'right', startIndex: 1, length: 1 });
  deleteSomething.reducer(state, 'right');
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.selection).toBe(null);
  expect(state.cursor.current).toBe('user');
  expect(state.cursor.userIndex).toBe(1);
  expect(state.document.content).toBeValidDocumentContent();
});

const mockedSerializeDocument = mocked(serializeDocument);
jest.mock('../../core/document', () => {
  const originalModule = jest.requireActual('../../core/document');

  return {
    __esModule: true,
    ...originalModule,
    serializeDocument: jest.fn(() => new JSZip()),
  };
});

jest.mock('electron', () => {
  const originalModule = jest.requireActual('electron');
  return {
    __esModule: true,
    ...originalModule,
    clipboard: {
      ...originalModule.clipboard,
      writeBuffer: jest.fn(() => {}),
      writeText: jest.fn(() => {}),
    },
  };
});
const mockedWriteText = mocked(clipboard.writeText);

afterEach(() => {
  jest.clearAllMocks();
});

const documentContentTwoParaTwoWordsTwoSpeaker = addUuids([
  { type: 'paragraph_start', speaker: 'Speaker One', language: null },
  { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
  { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
  { type: 'paragraph_break' },
  { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
  { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 3, conf: 1 },
  { type: 'paragraph_break' },
]);

test('copy', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.selection = { headPosition: 'left', startIndex: 0, length: 3 };
  await runAsyncThunkSync(copy(), state);
  // document should not be mutated by copy
  expect(state.document.content).toStrictEqualExceptUuids(documentContentTwoParaTwoSpeaker);
  // document has be serialized
  expect(mockedSerializeDocument).toHaveBeenCalledTimes(1);
  expect(mockedSerializeDocument.mock.calls[0].length).toBe(1);
  expect(mockedSerializeDocument.mock.calls[0][0]).toMatchObject({
    content: [
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
      { type: 'paragraph_break' },
    ],
  });
  expect(clipboard.writeBuffer).toHaveBeenCalled();
  expect(state.document.content).toBeValidDocumentContent();
});

test('copy adds para-start/break if needed', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoWordsTwoSpeaker);
  state.selection = { headPosition: 'left', startIndex: 2, length: 1 };
  await runAsyncThunkSync(copy(), state);
  expect(state.document.content).toStrictEqualExceptUuids(documentContentTwoParaTwoWordsTwoSpeaker);
  expect(mockedSerializeDocument).toHaveBeenCalledTimes(1);
  expect(mockedSerializeDocument.mock.calls[0].length).toBe(1);
  expect(mockedSerializeDocument.mock.calls[0][0].content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(clipboard.writeBuffer).toHaveBeenCalled();
  expect(state.document.content).toBeValidDocumentContent();
  expect(mockedSerializeDocument.mock.calls[0][0].content).toBeValidDocumentContent();
});

test('copy does nothing if no selection', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.selection = null;
  await runAsyncThunkSync(copy(), state);
  expect(mockedSerializeDocument).not.toHaveBeenCalled();
  expect(clipboard.writeBuffer).not.toHaveBeenCalled();
  expect(state.document.content).toBeValidDocumentContent();
});

test('cut', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.selection = { headPosition: 'left', startIndex: 0, length: 3 };
  await runAsyncThunkSync(cut(), state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  // document has be serialized
  expect(mockedSerializeDocument).toHaveBeenCalledTimes(1);
  expect(mockedSerializeDocument.mock.calls[0].length).toBe(1);
  expect(mockedSerializeDocument.mock.calls[0][0]).toMatchObject({
    content: [
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
      { type: 'paragraph_break' },
    ],
  });
  expect(clipboard.writeBuffer).toHaveBeenCalled();
  expect(state.document.content).toBeValidDocumentContent();
});

test('cut adds para-start/break if needed', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoWordsTwoSpeaker);
  state.selection = { headPosition: 'left', startIndex: 2, length: 1 };
  await runAsyncThunkSync(cut(), state);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 3, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(mockedSerializeDocument).toHaveBeenCalledTimes(1);
  expect(mockedSerializeDocument.mock.calls[0].length).toBe(1);
  expect(mockedSerializeDocument.mock.calls[0][0].content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(clipboard.writeBuffer).toHaveBeenCalled();
  expect(state.document.content).toBeValidDocumentContent();
  expect(mockedSerializeDocument.mock.calls[0][0].content).toBeValidDocumentContent();
});

test('cut does nothing if no selection', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentContentTwoParaTwoSpeaker);
  state.selection = null;
  await runAsyncThunkSync(cut(), state);
  expect(state.document.content).toStrictEqual(documentContentTwoParaTwoSpeaker);
  expect(mockedSerializeDocument).not.toHaveBeenCalled();
  expect(clipboard.writeBuffer).not.toHaveBeenCalled();
  expect(state.document.content).toBeValidDocumentContent();
});

// TODO: should we test the paste payload creator?

test('paste nothing is noop', async () => {
  const state = _.cloneDeep(defaultEditorState);
  const pastedDocument = { content: [], sources: {} };
  expect(paste.reducers?.fulfilled).not.toBe(undefined);
  if (paste.reducers?.fulfilled == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }
  paste.reducers?.fulfilled(state, pastedDocument);
  expect(state.document.sources).toStrictEqual({});
  expect(state.document.content).toStrictEqualExceptUuids(getEmptyDocument().content);
  expect(state.document.content).toBeValidDocumentContent();
});

test('paste with missing sources fails', async () => {
  const state = _.cloneDeep(defaultEditorState);
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {},
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }
  expect(() => {
    reducer(state, pastedDocument);
  }).toThrow('missing source');
  expect(state.document).toBeSameDocumentExceptUuids(getEmptyDocument());
  expect(state.document.content).toBeValidDocumentContent();
});

test('paste without leading para start fails', async () => {
  const state = _.cloneDeep(defaultEditorState);
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {
      'source-1': {
        objectUrl: 'blob://source-1',
        fileContents: new ArrayBuffer(0),
      },
    },
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }
  expect(() => {
    reducer(state, pastedDocument);
  }).toThrow('paragraph start');
  expect(state.document).toBeSameDocumentExceptUuids(getEmptyDocument());
  expect(state.document.content).toBeValidDocumentContent();
});

test('paste without trailing para break fails', async () => {
  const state = _.cloneDeep(defaultEditorState);
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    ]),
    sources: {
      'source-1': {
        objectUrl: 'blob://source-1',
        fileContents: new ArrayBuffer(0),
      },
    },
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }
  expect(() => {
    reducer(state, pastedDocument);
  }).toThrow('paragraph break');
  expect(state.document).toBeSameDocumentExceptUuids(getEmptyDocument());
});

test('paste minimal', async () => {
  const state = _.cloneDeep(defaultEditorState);
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {
      'source-1': {
        objectUrl: 'blob://source-1',
        fileContents: new ArrayBuffer(0),
      },
    },
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }

  reducer(state, pastedDocument);

  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.sources).toStrictEqual({
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
  });

  expect(state.document.content).toBeValidDocumentContent();
});

test('paste more complex', async () => {
  const state = _.cloneDeep(defaultEditorState);
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
      { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
      { type: 'text', text: 'Two', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'text', text: 'Two', conf: 1, source: 'source-2', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {
      'source-1': {
        objectUrl: 'blob://source-1',
        fileContents: new ArrayBuffer(0),
      },
      'source-2': {
        objectUrl: 'blob://source-2',
        fileContents: new ArrayBuffer(0),
      },
    },
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }
  reducer(state, pastedDocument);
  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Two', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    { type: 'text', text: 'Two', conf: 1, source: 'source-2', sourceStart: 1, length: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.sources).toStrictEqual({
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
    'source-2': {
      objectUrl: 'blob://source-2',
      fileContents: new ArrayBuffer(0),
    },
  });

  expect(state.document.content).toBeValidDocumentContent();
});

test('paste: existing empty paragraph', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'paragraph_break' },
  ]);
  state.cursor.current = 'user';
  state.cursor.userIndex = 1;
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {
      'source-1': {
        objectUrl: 'blob://source-1',
        fileContents: new ArrayBuffer(0),
      },
    },
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }

  reducer(state, pastedDocument);

  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.sources).toStrictEqual({
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
  });

  expect(state.document.content).toBeValidDocumentContent();
});

test('paste: existing data', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Test', conf: 1, source: 'source-non', sourceStart: 0, length: 1 },
    { type: 'paragraph_break' },
  ]);
  state.cursor.current = 'user';
  state.cursor.userIndex = 2;
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {
      'source-1': {
        objectUrl: 'blob://source-1',
        fileContents: new ArrayBuffer(0),
      },
    },
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }

  reducer(state, pastedDocument);

  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Test', conf: 1, source: 'source-non', sourceStart: 0, length: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.sources).toStrictEqual({
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
  });

  expect(state.document.content).toBeValidDocumentContent();
});
test('paste: pasting directly after a para start generates a new para start after the pasted content', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Test', conf: 1, source: 'source-non', sourceStart: 0, length: 1 },
    { type: 'paragraph_break' },
  ]);
  state.cursor.current = 'user';
  state.cursor.userIndex = 1;
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {
      'source-1': {
        objectUrl: 'blob://source-1',
        fileContents: new ArrayBuffer(0),
      },
    },
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }

  reducer(state, pastedDocument);

  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'Test', conf: 1, source: 'source-non', sourceStart: 0, length: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.sources).toStrictEqual({
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
  });

  expect(state.document.content).toBeValidDocumentContent();
});

const documentOneParaThreeWords = addUuids([
  { type: 'paragraph_start', speaker: 'Speaker One', language: null },
  { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
  { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
  { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
  { type: 'paragraph_break' },
]);

test('paste: replaces selection', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentOneParaThreeWords);
  state.cursor.current = 'user';
  state.cursor.userIndex = 2;
  state.selection = { headPosition: 'left', startIndex: 3, length: 1 };
  const pastedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
      { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {
      'source-1': {
        objectUrl: 'blob://source-1',
        fileContents: new ArrayBuffer(0),
      },
    },
  };
  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }

  reducer(state, pastedDocument);

  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.document.sources).toStrictEqual({
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
  });
  expect(state.document.content).toBeValidDocumentContent();
});

test.each([0, 1, 2])('copy&paste roundtrips as idx=%d', async (index: number) => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentOneParaThreeWords);
  state.document.sources = {
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
  };
  state.selection = { headPosition: 'left', startIndex: index, length: 2 };
  await runAsyncThunkSync(copy(), state);

  expect(mockedSerializeDocument).toHaveBeenCalledTimes(1);
  expect(mockedSerializeDocument.mock.calls[0].length).toBe(1);
  const copiedDocument: Document = mockedSerializeDocument.mock.calls[0][0];

  const reducer = paste.reducers?.fulfilled;

  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }

  reducer(state, copiedDocument);

  expect(state.document.content).toStrictEqualExceptUuids(documentOneParaThreeWords);
  expect(state.selection).toStrictEqual(null);

  expect(state.document.content).toBeValidDocumentContent();
});

test('paste: merges paras if same speaker name', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentOneParaThreeWords);
  state.document.sources = {
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
  };
  state.cursor.current = 'user';
  state.cursor.userIndex = 2;

  const copiedDocument: ClipboardDocument = {
    content: addUuids([
      { type: 'paragraph_start', speaker: 'Speaker One', language: null },
      { type: 'text', text: 'Pasted One', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
      { type: 'paragraph_break' },
    ]),
    sources: {},
  };

  const reducer = paste.reducers?.fulfilled;
  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }

  reducer(state, copiedDocument);

  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Pasted One', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.selection).toStrictEqual(null);

  expect(state.document.content).toBeValidDocumentContent();
});

test('paste: changes uuids', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = _.cloneDeep(documentOneParaThreeWords);
  state.document.sources = {
    'source-1': {
      objectUrl: 'blob://source-1',
      fileContents: new ArrayBuffer(0),
    },
  };
  state.cursor.current = 'user';
  state.cursor.userIndex = 2;

  const copiedDocument: ClipboardDocument = {
    content: [
      { type: 'paragraph_start', speaker: 'Speaker One', language: null, uuid: 'p1' },
      {
        type: 'text',
        text: 'Pasted One',
        length: 1,
        source: 'source-1',
        sourceStart: 2,
        conf: 1,
        uuid: 'p2',
      },
      { type: 'paragraph_break', uuid: 'p3' },
    ],
    sources: {},
  };

  const reducer = paste.reducers?.fulfilled;
  expect(reducer).not.toBe(undefined);
  if (reducer == undefined) {
    throw new Error('paste.reducers.fulfilled must be a function');
  }

  reducer(state, copiedDocument);

  expect(state.document.content).toStrictEqualExceptUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', length: 1, source: 'source-1', sourceStart: 1, conf: 1 },
    { type: 'text', text: 'Pasted One', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Two', length: 1, source: 'source-1', sourceStart: 2, conf: 1 },
    { type: 'text', text: 'Three', length: 1, source: 'source-1', sourceStart: 4, conf: 1 },
    { type: 'paragraph_break' },
  ]);
  expect(state.selection).toStrictEqual(null);
  expect(state.document.content[2].uuid).not.toBe('p2');

  expect(state.document.content).toBeValidDocumentContent();
});

test('copySelectionText', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Something Something', language: null },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 0, length: 1 },
    { type: 'text', text: 'Two', conf: 1, source: 'source-2', sourceStart: 1, length: 1 },
    { type: 'text', text: 'Three Four', conf: 1, source: 'source-1', sourceStart: 2, length: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'text', text: 'Five', conf: 1, source: 'source-2', sourceStart: 0, length: 1 },
    { type: 'text', text: 'Six', conf: 1, source: 'source-1', sourceStart: 1, length: 1 },
    { type: 'text', text: 'Seven Eight', conf: 1, source: 'source-2', sourceStart: 2, length: 1 },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Two', language: null },
    { type: 'paragraph_break' },
    { type: 'paragraph_start', speaker: 'Speaker Three', language: null },
    { type: 'text', text: 'Something', conf: 1, source: 'source-4', sourceStart: 0, length: 1 },
    { type: 'text', text: 'Something', conf: 1, source: 'source-4', sourceStart: 1, length: 1 },
    { type: 'paragraph_break' },
  ]);
  state.selection = {
    headPosition: 'left',
    startIndex: 1,
    length: 17,
  };
  state.displaySpeakerNames = true;

  await runAsyncThunkSync(copySelectionText(), state);

  expect(mockedWriteText).toHaveBeenCalledTimes(1);
  expect(mockedWriteText).toHaveBeenCalledWith(
    'Something Something:\n\n' +
      'Speaker One:\n' +
      'One Two Three Four\n' +
      '\n' +
      'Speaker Two:\nFive Six Seven Eight\n' +
      '\n' +
      'Speaker Two:\n\n' +
      'Speaker Three:\nSomething Something'
  );

  expect(state.document.content).toBeValidDocumentContent();
});

test('copySelectionText: no selection', async () => {
  const state = _.cloneDeep(defaultEditorState);
  state.document.content = addUuids([
    { type: 'paragraph_start', speaker: 'Speaker One', language: null },
    { type: 'text', text: 'One', conf: 1, source: 'source-1', sourceStart: 0, length: 1 },
    { type: 'paragraph_break' },
  ]);
  state.selection = null;

  await runAsyncThunkSync(copySelectionText(), state);

  expect(mockedWriteText).toHaveBeenCalledTimes(0);

  expect(state.document.content).toBeValidDocumentContent();
});
