const T = require('../../etc/js/terminal.js');

test('tokenize splits on whitespace and keeps groups', () => {
  const tokens = T.tokenize('set player Position {x: 10, y: 20}');
  expect(tokens.map((t) => t.text)).toEqual(['set', 'player', 'Position', '{x: 10, y: 20}']);
  expect(tokens[3].kind).toBe('group');
});

test('tokenize unescapes strings and keeps raw text', () => {
  const tokens = T.tokenize('eval "a\\nb" ```x "y"```');
  expect(tokens[1]).toMatchObject({ kind: 'string', text: 'a\nb', closed: true });
  expect(tokens[2]).toMatchObject({ kind: 'raw', text: 'x "y"', closed: true });
});

test('tokenize marks unclosed tokens', () => {
  expect(T.tokenize('query "Position').pop().closed).toBe(false);
  expect(T.tokenize('eval (1 + ').pop().closed).toBe(false);
  expect(T.tokenize('script_write s ```foo').pop().closed).toBe(false);
});

test('historyDiff appends new commands', () => {
  expect(T.historyDiff(['a', 'b'], ['a', 'b', 'c'], 256)).toEqual({ added: ['c'], cleared: false });
  expect(T.historyDiff([], ['a'], 256)).toEqual({ added: ['a'], cleared: false });
});

test('historyDiff detects clear', () => {
  expect(T.historyDiff(['a', 'b'], [], 256)).toEqual({ added: [], cleared: true });
  expect(T.historyDiff(['a', 'b'], ['c'], 256)).toEqual({ added: ['c'], cleared: true });
});

test('historyDiff handles truncated history', () => {
  expect(T.historyDiff(['a', 'b', 'c'], ['b', 'c', 'd'], 3)).toEqual({ added: ['d'], cleared: false });
  expect(T.historyDiff(['a', 'b', 'c'], ['c', 'd', 'e'], 3)).toEqual({ added: ['d', 'e'], cleared: false });
});

test('matchResults pairs commands with stored results in order', () => {
  const r = (n) => ({ scope: '#0', result: n, errors: [] });
  expect(T.matchResults(['a', 'b'], ['a', 'b'], [r(1), r(2)])).toEqual([r(1), r(2)]);
  expect(T.matchResults(['a', 'c'], ['a', 'b', 'c'], [r(1), r(2), r(3)])).toEqual([r(1), r(3)]);
  expect(T.matchResults(['a', 'a'], ['a', 'a'], [r(1), r(2)])).toEqual([r(1), r(2)]);
});

test('matchResults returns undefined for missing results', () => {
  expect(T.matchResults(['a', 'b'], ['a', 'b'], [])).toEqual([undefined, undefined]);
  expect(T.matchResults(['a', 'b'], ['a', 'b'], [null, { errors: [] }])).toEqual([undefined, { errors: [] }]);
  expect(T.matchResults(['x', 'a'], ['a'], [{ errors: [] }])).toEqual([undefined, undefined]);
});

test('treeLines draws guides', () => {
  const lines = T.treeLines([
    { entity: 'a', depth: 0 },
    { entity: 'a.b', depth: 1 },
    { entity: 'a.c', depth: 1 },
    { entity: 'd', depth: 0 }
  ]);
  expect(lines.map((l) => l.prefix)).toEqual([
    '├── ',
    '│   ├── ',
    '│   └── ',
    '└── '
  ]);
});

test('completionContext finds token under cursor', () => {
  expect(T.completionContext('inspect ga', 10)).toMatchObject({ index: 1, command: 'inspect', prefix: 'ga', start: 8 });
  expect(T.completionContext('inspect ', 8)).toMatchObject({ index: 1, prefix: '', start: 8 });
  expect(T.completionContext('ins', 3)).toMatchObject({ index: 0, prefix: 'ins' });
  expect(T.completionContext('eval "ab', 8)).toBeUndefined();
});

test('relativePath and shortName', () => {
  expect(T.relativePath('game.player', 'game')).toBe('player');
  expect(T.relativePath('other.x', 'game')).toBe('other.x');
  expect(T.shortName('etc.assets.scene\\.flecs')).toBe('scene.flecs');
  expect(T.shortName('#0')).toBe('(root)');
});

test('widgetFor maps result types to widgets', () => {
  expect(T.widgetFor('ls', 'flecs.script.typecache.vector<entity>')).toBe('entities');
  expect(T.widgetFor('query', 'flecs.script.typecache.vector<QueryRow>')).toBe('query');
  expect(T.widgetFor('inspect', 'flecs.script.command.EntityInfo')).toBe('inspect');
  expect(T.widgetFor('script_diff', 'flecs.meta.string')).toBe('diff');
  expect(T.widgetFor('schema', 'flecs.meta.string')).toBe('code');
  expect(T.widgetFor('get', 'flecs.meta.value')).toBe('value');
  expect(T.widgetFor('remove', undefined)).toBeUndefined();
});

test('sessionIndexPath strips generation', () => {
  expect(T.sessionIndexPath('4294967904')).toBe('#608');
  expect(T.sessionIndexPath('607')).toBe('#607');
});

test('parseId splits pairs', () => {
  expect(T.parseId('Position')).toEqual(['Position']);
  expect(T.parseId('(Identifier, Name)')).toEqual(['Identifier', 'Name']);
  expect(T.parseId('(Likes, (A, B))')).toEqual(['Likes', '(A, B)']);
});
