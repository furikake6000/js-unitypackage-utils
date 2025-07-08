/**
 * データURL文字列をArrayBufferに変換する
 * @param dataUrl データURL（data:image/png;base64,xxx形式）
 * @returns ArrayBuffer
 */
export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  // データURLの形式チェック
  if (!dataUrl.startsWith('data:')) {
    throw new Error('無効なデータURL形式です');
  }

  // base64部分を抽出
  const base64Index = dataUrl.indexOf('base64,');
  if (base64Index === -1) {
    throw new Error('base64形式のデータURLではありません');
  }

  const base64String = dataUrl.substring(base64Index + 7);

  // base64をバイナリデータに変換
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * ArrayBufferをUint8Arrayに変換する
 * @param buffer ArrayBuffer
 * @returns Uint8Array
 */
export function arrayBufferToUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

/**
 * 文字列をUTF-8バイト配列に変換する
 * @param text 文字列
 * @returns Uint8Array
 */
export function stringToUint8Array(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

/**
 * UTF-8バイト配列を文字列に変換する
 * @param bytes Uint8Array
 * @returns 文字列
 */
export function uint8ArrayToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

/**
 * データURLからMIMEタイプを抽出する
 * @param dataUrl データURL
 * @returns MIMEタイプ（例: 'image/png'）
 */
export function extractMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  if (!match) {
    throw new Error('MIMEタイプを抽出できませんでした');
  }
  return match[1];
}

/**
 * ファイル拡張子からMIMEタイプを推測する
 * @param filename ファイル名
 * @returns MIMEタイプ
 */
export function getMimeTypeFromExtension(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();

  const mimeTypes: { [key: string]: string } = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * 画像データを指定された形式に変換する（ブラウザのCanvas APIを使用）
 * @param imageData 元の画像データ
 * @param format 変換後の形式
 * @param quality 品質（0.0-1.0、JPEG用）
 * @returns 変換後の画像データ
 */
export async function convertImageFormat(
  imageData: ArrayBuffer,
  format: 'png' | 'jpeg' | 'webp',
  quality: number = 0.8,
): Promise<ArrayBuffer> {
  if (typeof window === 'undefined') {
    throw new Error(
      'convertImageFormat is only available in browser environment',
    );
  }

  return new Promise((resolve, reject) => {
    // Blobを作成
    const blob = new Blob([imageData]);
    const url = URL.createObjectURL(blob);

    // 画像を読み込み
    const img = new window.Image();
    img.onload = () => {
      try {
        // Canvasに描画
        const canvas = window.document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D contextを取得できませんでした');
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 指定された形式で変換
        canvas.toBlob(
          (resultBlob) => {
            if (!resultBlob) {
              reject(new Error('画像変換に失敗しました'));
              return;
            }

            // BlobをArrayBufferに変換
            const reader = new window.FileReader();
            reader.onload = () => {
              URL.revokeObjectURL(url);
              resolve(reader.result as ArrayBuffer);
            };
            reader.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error('ファイル読み込みエラー'));
            };
            reader.readAsArrayBuffer(resultBlob);
          },
          `image/${format}`,
          quality,
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像読み込みエラー'));
    };

    img.src = url;
  });
}

/**
 * ファイルサイズを人間が読みやすい形式に変換する
 * @param bytes バイト数
 * @returns フォーマットされた文字列
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(1)} ${sizes[i]}`;
}

/**
 * ファイルの内容を検証する（基本的なヘッダーチェック）
 * @param data ファイルデータ
 * @param expectedType 期待するファイルタイプ
 * @returns 検証結果
 */
export function validateFileType(
  data: Uint8Array,
  expectedType: 'png' | 'jpeg' | 'gif',
): boolean {
  if (data.length < 8) return false;

  const signatures: { [key: string]: number[] } = {
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    jpeg: [0xff, 0xd8, 0xff],
    gif: [0x47, 0x49, 0x46, 0x38], // GIF8
  };

  const signature = signatures[expectedType];
  if (!signature) return false;

  for (let i = 0; i < signature.length; i++) {
    if (data[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}
