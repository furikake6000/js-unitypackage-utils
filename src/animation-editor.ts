import * as yaml from 'js-yaml';

/**
 * Unity アニメーションファイルのキーフレーム情報
 */
export interface Keyframe {
  time: number;
  value: number;
  inSlope: number;
  outSlope: number;
  tangentMode: number;
  weightedMode: number;
  inWeight: number;
  outWeight: number;
}

/**
 * Unity アニメーションのFloat曲線情報
 */
export interface FloatCurve {
  attribute: string;
  path: string;
  keyframes: Keyframe[];
}

/**
 * YAML解析時の内部データ構造
 */
interface ParsedKeyframe {
  time?: number;
  value?: number;
  inSlope?: number | string;
  outSlope?: number | string;
  tangentMode?: number;
  weightedMode?: number;
  inWeight?: number;
  outWeight?: number;
}

interface ParsedCurveData {
  attribute?: string;
  path?: string;
  curve?: {
    m_Curve?: ParsedKeyframe[];
  };
}

/**
 * Unity アニメーションファイル（.anim）エディター
 * m_FloatCurves のみを対象とした軽量実装
 */
export class UnityAnimationEditor {
  private originalYaml: string = '';
  private animationName: string = '';
  private floatCurves: FloatCurve[] = [];

  /**
   * YAML文字列からアニメーションデータを読み込み
   */
  loadFromYaml(yamlContent: string): void {
    this.originalYaml = yamlContent;
    this.parseNameAndCurves();
  }

  /**
   * アニメーション名を取得
   */
  getName(): string {
    return this.animationName;
  }

  /**
   * アニメーション名を設定
   */
  setName(name: string): void {
    this.animationName = name;
  }

  /**
   * すべてのFloat曲線を取得
   */
  getFloatCurves(): FloatCurve[] {
    return this.floatCurves;
  }

  /**
   * 指定されたattributeとpathのFloat曲線を取得
   */
  getCurve(attribute: string, path: string): FloatCurve | undefined {
    return this.floatCurves.find(
      (c) => c.attribute === attribute && c.path === path,
    );
  }

  /**
   * Float曲線を追加または更新
   */
  addCurve(curve: FloatCurve): void {
    const existing = this.getCurve(curve.attribute, curve.path);
    if (existing) {
      existing.keyframes = curve.keyframes;
    } else {
      this.floatCurves.push(curve);
    }
  }

  /**
   * Float曲線を削除
   */
  removeCurve(attribute: string, path: string): void {
    this.floatCurves = this.floatCurves.filter(
      (c) => !(c.attribute === attribute && c.path === path),
    );
  }

  /**
   * 指定されたFloat曲線にキーフレームを追加
   */
  addKeyframe(attribute: string, path: string, keyframe: Keyframe): void {
    const curve = this.getCurve(attribute, path);
    if (curve) {
      curve.keyframes.push(keyframe);
      curve.keyframes.sort((a, b) => a.time - b.time);
    }
  }

  /**
   * 指定されたFloat曲線からキーフレームを削除（時間による検索）
   */
  removeKeyframe(attribute: string, path: string, time: number): void {
    const curve = this.getCurve(attribute, path);
    if (curve) {
      curve.keyframes = curve.keyframes.filter(
        (k) => Math.abs(k.time - time) > 0.001,
      );
    }
  }

  /**
   * 修正されたYAMLを出力
   */
  exportToYaml(): string {
    return this.rebuildYaml();
  }

  /**
   * YAML内のm_NameとFloatCurvesを解析
   */
  private parseNameAndCurves(): void {
    try {
      // AnimationClip部分のみを抽出
      const animationClipMatch = this.originalYaml.match(
        /AnimationClip:([\s\S]*?)(?=\n\S|$)/,
      );

      if (animationClipMatch) {
        const animationClipYaml = animationClipMatch[1];
        const parsed = yaml.load(animationClipYaml) as Record<string, unknown>;

        // m_Nameを抽出
        this.animationName = (parsed.m_Name as string) || '';

        // m_FloatCurvesを抽出
        this.floatCurves = this.parseFloatCurvesFromParsed(
          (parsed.m_FloatCurves as unknown[]) || [],
        );
      }
    } catch (error) {
      // console.warn("YAML解析エラー、フォールバック処理を実行:", error);
      // フォールバック: 正規表現による解析
      this.parseNameAndCurvesFallback();
    }
  }

  /**
   * 解析済みm_FloatCurvesからFloatCurve配列を生成
   */
  private parseFloatCurvesFromParsed(floatCurvesData: unknown[]): FloatCurve[] {
    if (!Array.isArray(floatCurvesData)) return [];

    return floatCurvesData.map((curveData: unknown) => {
      const parsed = curveData as ParsedCurveData;
      return {
        attribute: parsed.attribute || '',
        path: parsed.path || '',
        keyframes: (parsed.curve?.m_Curve || []).map((kf: ParsedKeyframe) => ({
          time: typeof kf.time === 'number' ? kf.time : 0,
          value: typeof kf.value === 'number' ? kf.value : 0,
          inSlope: this.parseNumericValue(kf.inSlope),
          outSlope: this.parseNumericValue(kf.outSlope),
          tangentMode: typeof kf.tangentMode === 'number' ? kf.tangentMode : 0,
          weightedMode:
            typeof kf.weightedMode === 'number' ? kf.weightedMode : 0,
          inWeight: typeof kf.inWeight === 'number' ? kf.inWeight : 0.33333334,
          outWeight:
            typeof kf.outWeight === 'number' ? kf.outWeight : 0.33333334,
        })),
      };
    });
  }

  /**
   * 数値またはInfinityを適切に解析
   */
  private parseNumericValue(value: unknown): number {
    if (typeof value === 'number') return value;
    if (value === 'Infinity' || value === Infinity) return Infinity;
    if (value === '-Infinity' || value === -Infinity) return -Infinity;
    return 0;
  }

  /**
   * フォールバック: 正規表現による解析
   */
  private parseNameAndCurvesFallback(): void {
    // m_Nameを正規表現で抽出
    const nameMatch = this.originalYaml.match(/m_Name:\s*(.+)/);
    this.animationName = nameMatch ? nameMatch[1].trim() : '';

    // FloatCurvesは空として処理（複雑すぎるため）
    this.floatCurves = [];
  }

  /**
   * 元のYAMLを基に、変更された部分のみを更新して再構築
   */
  private rebuildYaml(): string {
    try {
      // AnimationClip部分を抽出
      const animationClipMatch = this.originalYaml.match(
        /AnimationClip:([\s\S]*?)(?=\n\S|$)/,
      );

      if (animationClipMatch) {
        const animationClipYaml = animationClipMatch[1];
        const parsed = yaml.load(animationClipYaml) as Record<string, unknown>;

        // データを更新
        parsed.m_Name = this.animationName;
        parsed.m_FloatCurves = this.buildFloatCurvesData();

        // 新しいAnimationClipYAMLを生成
        const newAnimationClipYaml = yaml.dump(parsed, {
          indent: 2,
          flowLevel: -1,
          noRefs: true,
        });

        // インデントを調整（元のインデントに合わせる）
        const indentedNewYaml = newAnimationClipYaml
          .split('\n')
          .map((line) => (line ? '  ' + line : line))
          .join('\n');

        // 元のYAMLの該当部分を置換
        return this.originalYaml.replace(
          /AnimationClip:[\s\S]*?(?=\n\S|$)/,
          `AnimationClip:\n${indentedNewYaml}`,
        );
      }

      return this.originalYaml;
    } catch (error) {
      // console.warn("YAML再構築エラー、フォールバック処理を実行:", error);
      return this.rebuildYamlFallback();
    }
  }

  /**
   * フォールバック: 正規表現による再構築
   */
  private rebuildYamlFallback(): string {
    let result = this.originalYaml;

    // m_Nameを置換
    result = result.replace(/m_Name:\s*.+/, `m_Name: ${this.animationName}`);

    // m_FloatCurvesセクションを完全置換
    const newFloatCurvesYaml = this.buildFloatCurvesYaml();
    result = result.replace(
      /m_FloatCurves:[\s\S]*?(?=\n\s*m_\w+:|$)/,
      `m_FloatCurves:${newFloatCurvesYaml}`,
    );

    return result;
  }

  /**
   * FloatCurves配列からUnity形式のデータ構造を生成
   */
  private buildFloatCurvesData(): unknown[] {
    return this.floatCurves.map((curve) => ({
      serializedVersion: 2,
      curve: {
        serializedVersion: 2,
        m_Curve: curve.keyframes.map((kf) => ({
          serializedVersion: 3,
          time: kf.time,
          value: kf.value,
          inSlope: kf.inSlope === Infinity ? 'Infinity' : kf.inSlope,
          outSlope: kf.outSlope === Infinity ? 'Infinity' : kf.outSlope,
          tangentMode: kf.tangentMode,
          weightedMode: kf.weightedMode,
          inWeight: kf.inWeight,
          outWeight: kf.outWeight,
        })),
        m_PreInfinity: 2,
        m_PostInfinity: 2,
        m_RotationOrder: 4,
      },
      attribute: curve.attribute,
      path: curve.path,
      classID: 137,
      script: { fileID: 0 },
      flags: 16,
    }));
  }

  /**
   * FloatCurves配列からUnity形式のYAMLを生成（フォールバック用）
   */
  private buildFloatCurvesYaml(): string {
    if (this.floatCurves.length === 0) return '\n  []';

    const curvesData = this.floatCurves.map((curve) => ({
      serializedVersion: 2,
      curve: {
        serializedVersion: 2,
        m_Curve: curve.keyframes.map((kf) => ({
          serializedVersion: 3,
          time: kf.time,
          value: kf.value,
          inSlope: kf.inSlope,
          outSlope: kf.outSlope,
          tangentMode: kf.tangentMode,
          weightedMode: kf.weightedMode,
          inWeight: kf.inWeight,
          outWeight: kf.outWeight,
        })),
        m_PreInfinity: 2,
        m_PostInfinity: 2,
        m_RotationOrder: 4,
      },
      attribute: curve.attribute,
      path: curve.path,
      classID: 137,
      script: { fileID: 0 },
      flags: 16,
    }));

    // YAMLダンプ時のインデント調整
    const yamlStr = yaml.dump(curvesData, {
      indent: 2,
      flowLevel: -1,
      noRefs: true,
    });

    // Unityの形式に合わせてインデント調整（先頭に2スペースを追加）
    return (
      '\n' +
      yamlStr
        .split('\n')
        .map((line) => (line ? '  ' + line : line))
        .join('\n')
    );
  }
}
