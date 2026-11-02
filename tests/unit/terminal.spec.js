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

test('widgetFor shows resources with an image type as images', () => {
  const type = 'flecs.script.shell.resource';
  expect(T.widgetFor('capture', type, { name: '1', content_type: 'image/png' })).toBe('image');
  expect(T.widgetFor('capture', type, { name: '1', content_type: 'IMAGE/JPEG' })).toBe('image');
  expect(T.widgetFor('dump', type, { name: '1', content_type: 'text/plain' })).toBe('value');
  expect(T.widgetFor('capture', type, { name: null, content_type: null })).toBe('value');
  expect(T.widgetFor('capture', type, undefined)).toBe('value');
});

test('entityInfoCommand picks the command supported by the app', () => {
  expect(T.entityInfoCommand(new Map([['cat', {}]]))).toBe('cat');
  expect(T.entityInfoCommand(new Map([['inspect', {}]]))).toBe('inspect');
  expect(T.entityInfoCommand(new Map())).toBe('cat');
  expect(T.READONLY_COMMANDS.has('cat')).toBe(true);
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

test('tokenize stops words at separators', () => {
  expect(T.tokenize('cd a;ls').map((t) => t.kind)).toEqual(['word', 'word', 'separator', 'word']);
  expect(T.tokenize('eval {a; b} "c;d" ```e;f```').map((t) => t.kind)).toEqual(['word', 'group', 'string', 'raw']);
});

test('splitCommands splits on top level separators', () => {
  expect(T.splitCommands('cd flecs; cat core.Component')).toEqual(['cd flecs', 'cat core.Component']);
  expect(T.splitCommands(' ;; a b ;c; ')).toEqual(['a b', 'c']);
  expect(T.splitCommands('eval (a;b); eval "c;d"; run ```e;f```')).toEqual(['eval (a;b)', 'eval "c;d"', 'run ```e;f```']);
  expect(T.splitCommands(' ; ')).toEqual([]);
});

test('splitCommands keeps the remainder after a parse error as one command', () => {
  expect(T.splitCommands('a; b ); c ')).toEqual(['a', 'b ); c']);
  expect(T.splitCommands('a; eval "b; c')).toEqual(['a', 'eval "b; c']);
});

test('commandReplies returns a flat reply per command with errors on the last', () => {
  const replies = T.commandReplies({
    results: [{ type: 'flecs.meta.entity', result: 'game' }, {}],
    errors: ['failed']
  });
  expect(replies).toEqual([
    { type: 'flecs.meta.entity', result: 'game', errors: [] },
    { errors: ['failed'] }
  ]);
  expect(T.commandReplies({ results: [{ type: 't', result: 1, more: true }], errors: [] })[0])
    .toMatchObject({ type: 't', result: 1, more: true, errors: [] });
});

test('commandReplies handles replies without results', () => {
  expect(T.commandReplies({ error: 'invalid command session' })).toEqual([
    { error: 'invalid command session', errors: ['invalid command session'] }
  ]);
  expect(T.commandReplies({ results: [], errors: ['e'] })).toEqual([{ errors: ['e'] }]);
  expect(T.commandReplies({})).toEqual([{ errors: [] }]);
});

test('completionContext is relative to the command under the cursor', () => {
  expect(T.completionContext('cd a; inspect ga', 16)).toMatchObject({ index: 1, command: 'inspect', prefix: 'ga', start: 14 });
  expect(T.completionContext('cd a; in', 8)).toMatchObject({ index: 0, command: 'in', prefix: 'in', start: 6 });
  expect(T.completionContext('cd a;', 5)).toMatchObject({ index: 0, command: '', prefix: '', start: 5 });
});

test('highlightCommand highlights the command after a separator', () => {
  const cmds = new Map([['cd', {}], ['ls', {}]]);
  expect(T.highlightCommand('cd a; ls; foo', cmds).filter((t) => t.cls === 'cmd' || t.cls === 'cmd-unknown'))
    .toEqual([{ text: 'cd', cls: 'cmd' }, { text: 'ls', cls: 'cmd' }, { text: 'foo', cls: 'cmd-unknown' }]);
});
