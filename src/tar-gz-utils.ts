import { parseTarGzip, createTarGzip } from 'nanotar';

/**
 * tar.gzアーカイブの展開結果
 */
export interface TarGzEntry {
  name: string;
  data: Uint8Array;
  isDirectory: boolean;
}

/**
 * tar.gzアーカイブを展開する
 * @param compressedData 圧縮されたtar.gzデータ
 * @returns 展開されたファイル一覧
 */
export async function extractTarGz(
  compressedData: ArrayBuffer,
): Promise<Map<string, TarGzEntry>> {
  try {
    const gzipData = new Uint8Array(compressedData);
    const files = await parseTarGzip(gzipData);

    const entries = new Map<string, TarGzEntry>();

    for (const file of files) {
      entries.set(file.name, {
        name: file.name,
        data: file.data || new Uint8Array(0),
        isDirectory: file.type === 'directory',
      });
    }

    return entries;
  } catch (error) {
    throw new Error(
      `tar.gz展開エラー: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * ファイル一覧をtar.gzアーカイブに圧縮する
 * @param entries 圧縮するファイル一覧
 * @returns 圧縮されたtar.gzデータ
 */
export async function compressTarGz(
  entries: Map<string, TarGzEntry>,
): Promise<ArrayBuffer> {
  try {
    const files = Array.from(entries.values()).map((entry) => ({
      name: entry.name,
      data: entry.data,
      type: entry.isDirectory ? ('directory' as const) : ('file' as const),
    }));

    const compressed = await createTarGzip(files);

    const buffer = compressed.buffer as ArrayBuffer;
    return buffer.slice(
      compressed.byteOffset,
      compressed.byteOffset + compressed.byteLength,
    );
  } catch (error) {
    throw new Error(
      `tar.gz圧縮エラー: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * エントリのデータを更新する
 * @param entries エントリマップ
 * @param path ファイルパス
 * @param data 新しいデータ
 */
export function updateEntry(
  entries: Map<string, TarGzEntry>,
  path: string,
  data: Uint8Array,
): void {
  const existingEntry = entries.get(path);

  if (existingEntry) {
    // 既存エントリの更新
    existingEntry.data = data;
  } else {
    // 新規エントリの追加
    entries.set(path, {
      name: path,
      data,
      isDirectory: false,
    });
  }
}

/**
 * エントリの削除
 * @param entries エントリマップ
 * @param path 削除するファイルパス
 */
export function removeEntry(
  entries: Map<string, TarGzEntry>,
  path: string,
): boolean {
  return entries.delete(path);
}

/**
 * パスパターンにマッチするエントリを検索
 * @param entries エントリマップ
 * @param pattern 検索パターン（部分一致）
 * @returns マッチしたエントリの配列
 */
export function findEntries(
  entries: Map<string, TarGzEntry>,
  pattern: string,
): TarGzEntry[] {
  const result: TarGzEntry[] = [];

  for (const entry of Array.from(entries.values())) {
    if (entry.name.includes(pattern)) {
      result.push(entry);
    }
  }

  return result;
}

/**
 * エントリの一覧を取得（デバッグ用）
 * @param entries エントリマップ
 * @returns ファイルパスの配列
 */
export function listEntries(entries: Map<string, TarGzEntry>): string[] {
  return Array.from(entries.keys()).sort();
}
