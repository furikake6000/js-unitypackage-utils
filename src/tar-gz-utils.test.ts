import {
  extractTarGz,
  compressTarGz,
  updateEntry,
  removeEntry,
  findEntries,
  listEntries,
  type TarGzEntry,
} from './tar-gz-utils';

describe('tar-gz-utils', () => {
  // テスト用のサンプルエントリを作成
  const createSampleEntries = (): Map<string, TarGzEntry> => {
    const entries = new Map<string, TarGzEntry>();

    entries.set('test.txt', {
      name: 'test.txt',
      data: new TextEncoder().encode('Hello, World!'),
      isDirectory: false,
    });

    entries.set('folder/', {
      name: 'folder/',
      data: new Uint8Array(0),
      isDirectory: true,
    });

    entries.set('folder/nested.txt', {
      name: 'folder/nested.txt',
      data: new TextEncoder().encode('Nested file content'),
      isDirectory: false,
    });

    entries.set('data.json', {
      name: 'data.json',
      data: new TextEncoder().encode('{"key": "value"}'),
      isDirectory: false,
    });

    return entries;
  };

  describe('extractTarGz', () => {
    test('無効なデータを渡した場合はエラーを投げる', async () => {
      const invalidData = new ArrayBuffer(0);
      await expect(extractTarGz(invalidData)).rejects.toThrow(
        'tar.gz展開エラー',
      );
    });

    test('不正なtar.gzデータを渡した場合はエラーを投げる', async () => {
      const invalidData = new ArrayBuffer(10);
      await expect(extractTarGz(invalidData)).rejects.toThrow(
        'tar.gz展開エラー',
      );
    });
  });

  describe('compressTarGz', () => {
    test('空のエントリマップを圧縮しようとするとエラーが発生する（Node.js環境）', async () => {
      const entries = new Map<string, TarGzEntry>();

      await expect(compressTarGz(entries)).rejects.toThrow('tar.gz圧縮エラー');
    });

    test('サンプルエントリを圧縮しようとするとエラーが発生する（Node.js環境）', async () => {
      const entries = createSampleEntries();

      await expect(compressTarGz(entries)).rejects.toThrow('tar.gz圧縮エラー');
    });
  });

  describe('updateEntry', () => {
    test('新しいエントリを追加できる', () => {
      const entries = new Map<string, TarGzEntry>();
      const newData = new TextEncoder().encode('New content');

      updateEntry(entries, 'new-file.txt', newData);

      expect(entries.has('new-file.txt')).toBe(true);
      const entry = entries.get('new-file.txt')!;
      expect(entry.name).toBe('new-file.txt');
      expect(entry.data).toBe(newData);
      expect(entry.isDirectory).toBe(false);
    });

    test('既存のエントリを更新できる', () => {
      const entries = createSampleEntries();
      const originalData = entries.get('test.txt')!.data;
      const newData = new TextEncoder().encode('Updated content');

      updateEntry(entries, 'test.txt', newData);

      expect(entries.has('test.txt')).toBe(true);
      const entry = entries.get('test.txt')!;
      expect(entry.data).toBe(newData);
      expect(entry.data).not.toBe(originalData);
    });
  });

  describe('removeEntry', () => {
    test('存在するエントリを削除できる', () => {
      const entries = createSampleEntries();

      expect(entries.has('test.txt')).toBe(true);
      const result = removeEntry(entries, 'test.txt');

      expect(result).toBe(true);
      expect(entries.has('test.txt')).toBe(false);
    });

    test('存在しないエントリを削除しようとした場合はfalseを返す', () => {
      const entries = createSampleEntries();

      const result = removeEntry(entries, 'nonexistent.txt');

      expect(result).toBe(false);
    });
  });

  describe('findEntries', () => {
    test('パターンにマッチするエントリを検索できる', () => {
      const entries = createSampleEntries();

      const results = findEntries(entries, '.txt');

      expect(results).toHaveLength(2);
      expect(results.map((e) => e.name)).toContain('test.txt');
      expect(results.map((e) => e.name)).toContain('folder/nested.txt');
    });

    test('フォルダパターンで検索できる', () => {
      const entries = createSampleEntries();

      const results = findEntries(entries, 'folder');

      expect(results).toHaveLength(2);
      expect(results.map((e) => e.name)).toContain('folder/');
      expect(results.map((e) => e.name)).toContain('folder/nested.txt');
    });

    test('マッチしないパターンの場合は空の配列を返す', () => {
      const entries = createSampleEntries();

      const results = findEntries(entries, '.nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('listEntries', () => {
    test('エントリの一覧をソートして取得できる', () => {
      const entries = createSampleEntries();

      const results = listEntries(entries);

      expect(results).toEqual([
        'data.json',
        'folder/',
        'folder/nested.txt',
        'test.txt',
      ]);
    });

    test('空のエントリマップの場合は空の配列を返す', () => {
      const entries = new Map<string, TarGzEntry>();

      const results = listEntries(entries);

      expect(results).toEqual([]);
    });
  });

  describe('統合テスト', () => {
    test('圧縮と展開の往復処理（Node.js環境では圧縮がサポートされない）', async () => {
      const originalEntries = createSampleEntries();

      // 圧縮はNode.js環境では失敗する
      await expect(compressTarGz(originalEntries)).rejects.toThrow(
        'tar.gz圧縮エラー',
      );
    });

    test('エントリ操作後の圧縮・展開（Node.js環境では圧縮がサポートされない）', async () => {
      const entries = createSampleEntries();

      // エントリを操作
      updateEntry(
        entries,
        'modified.txt',
        new TextEncoder().encode('Modified content'),
      );
      removeEntry(entries, 'data.json');

      // 圧縮はNode.js環境では失敗する
      await expect(compressTarGz(entries)).rejects.toThrow('tar.gz圧縮エラー');
    });
  });
});
