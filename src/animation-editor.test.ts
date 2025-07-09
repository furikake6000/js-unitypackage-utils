import {
  UnityAnimationEditor,
  type Keyframe,
  type FloatCurve,
} from './animation-editor';

describe('animation-editor', () => {
  // テスト用のサンプルYAMLデータ
  const sampleAnimationYaml = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!74 &7400000
AnimationClip:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: TestAnimation
  serializedVersion: 6
  m_Legacy: 0
  m_Compressed: 0
  m_UseHighQualityCurve: 1
  m_RotationCurves: []
  m_CompressedRotationCurves: []
  m_EulerCurves: []
  m_PositionCurves: []
  m_ScaleCurves: []
  m_FloatCurves:
  - serializedVersion: 2
    curve:
      serializedVersion: 2
      m_Curve:
      - serializedVersion: 3
        time: 0
        value: 0
        inSlope: 0
        outSlope: 0
        tangentMode: 0
        weightedMode: 0
        inWeight: 0.33333334
        outWeight: 0.33333334
      - serializedVersion: 3
        time: 1
        value: 1
        inSlope: 1
        outSlope: 1
        tangentMode: 0
        weightedMode: 0
        inWeight: 0.33333334
        outWeight: 0.33333334
      m_PreInfinity: 2
      m_PostInfinity: 2
      m_RotationOrder: 4
    attribute: m_LocalPosition.x
    path: GameObject
    classID: 137
    script: {fileID: 0}
    flags: 16
  - serializedVersion: 2
    curve:
      serializedVersion: 2
      m_Curve:
      - serializedVersion: 3
        time: 0
        value: 0
        inSlope: Infinity
        outSlope: Infinity
        tangentMode: 65
        weightedMode: 0
        inWeight: 0.33333334
        outWeight: 0.33333334
      m_PreInfinity: 2
      m_PostInfinity: 2
      m_RotationOrder: 4
    attribute: m_LocalPosition.y
    path: GameObject
    classID: 137
    script: {fileID: 0}
    flags: 16
  m_PPtrCurves: []
  m_SampleRate: 60
  m_WrapMode: 0
  m_Bounds:
    m_Center: {x: 0, y: 0, z: 0}
    m_Extent: {x: 0, y: 0, z: 0}
  m_ClipBindingConstant:
    genericBindings:
    - serializedVersion: 2
      path: 2073732238
      attribute: 1
      script: {fileID: 0}
      typeID: 4
      customType: 0
      isPPtrCurve: 0
    - serializedVersion: 2
      path: 2073732238
      attribute: 2
      script: {fileID: 0}
      typeID: 4
      customType: 0
      isPPtrCurve: 0
    pptrCurveMapping: []
  m_AnimationClipSettings:
    serializedVersion: 2
    m_AdditiveReferencePoseClip: {fileID: 0}
    m_AdditiveReferencePoseTime: 0
    m_StartTime: 0
    m_StopTime: 1
    m_OrientationOffsetY: 0
    m_Level: 0
    m_CycleOffset: 0
    m_HasAdditiveReferencePose: 0
    m_LoopTime: 0
    m_LoopBlend: 0
    m_LoopBlendOrientation: 0
    m_LoopBlendPositionY: 0
    m_LoopBlendPositionXZ: 0
    m_KeepOriginalOrientation: 0
    m_KeepOriginalPositionY: 1
    m_KeepOriginalPositionXZ: 0
    m_HeightFromFeet: 0
    m_Mirror: 0
  m_EditorCurves: []
  m_EulerEditorCurves: []
  m_HasGenericRootTransform: 0
  m_HasMotionFloatCurves: 0
  m_Events: []`;

  const simpleYamlWithoutFloatCurves = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!74 &7400000
AnimationClip:
  m_ObjectHideFlags: 0
  m_Name: SimpleAnimation
  m_FloatCurves: []`;

  const createSampleKeyframe = (time: number, value: number): Keyframe => ({
    time,
    value,
    inSlope: 0,
    outSlope: 0,
    tangentMode: 0,
    weightedMode: 0,
    inWeight: 0.33333334,
    outWeight: 0.33333334,
  });

  const createSampleFloatCurve = (): FloatCurve => ({
    attribute: 'm_LocalPosition.z',
    path: 'TestObject',
    keyframes: [
      createSampleKeyframe(0, 0),
      createSampleKeyframe(1, 10),
      createSampleKeyframe(2, 5),
    ],
  });

  describe('UnityAnimationEditor', () => {
    describe('constructor', () => {
      test('新しいインスタンスを作成できる', () => {
        const editor = new UnityAnimationEditor();

        expect(editor).toBeInstanceOf(UnityAnimationEditor);
        expect(editor.getName()).toBe('');
        expect(editor.getFloatCurves()).toEqual([]);
      });
    });

    describe('loadFromYaml', () => {
      test('正常なYAMLを読み込める', () => {
        const editor = new UnityAnimationEditor();

        editor.loadFromYaml(sampleAnimationYaml);

        expect(editor.getName()).toBe('TestAnimation');
        expect(editor.getFloatCurves()).toHaveLength(2);

        const curves = editor.getFloatCurves();
        expect(curves[0].attribute).toBe('m_LocalPosition.x');
        expect(curves[0].path).toBe('GameObject');
        expect(curves[0].keyframes).toHaveLength(2);

        expect(curves[1].attribute).toBe('m_LocalPosition.y');
        expect(curves[1].path).toBe('GameObject');
        expect(curves[1].keyframes).toHaveLength(1);
      });

      test('FloatCurvesが空のYAMLを読み込める', () => {
        const editor = new UnityAnimationEditor();

        editor.loadFromYaml(simpleYamlWithoutFloatCurves);

        expect(editor.getName()).toBe('SimpleAnimation');
        expect(editor.getFloatCurves()).toEqual([]);
      });

      test('Infinityを含むキーフレームを正しく処理できる', () => {
        const editor = new UnityAnimationEditor();

        editor.loadFromYaml(sampleAnimationYaml);

        const curves = editor.getFloatCurves();
        const yCurve = curves.find((c) => c.attribute === 'm_LocalPosition.y');

        expect(yCurve).toBeDefined();
        expect(yCurve!.keyframes[0].inSlope).toBe(Infinity);
        expect(yCurve!.keyframes[0].outSlope).toBe(Infinity);
      });

      test('無効なYAMLの場合はフォールバック処理を実行する', () => {
        const editor = new UnityAnimationEditor();
        const invalidYaml = 'invalid yaml content';

        editor.loadFromYaml(invalidYaml);

        expect(editor.getName()).toBe('');
        expect(editor.getFloatCurves()).toEqual([]);
      });
    });

    describe('getName and setName', () => {
      test('アニメーション名を設定・取得できる', () => {
        const editor = new UnityAnimationEditor();

        editor.setName('MyAnimation');

        expect(editor.getName()).toBe('MyAnimation');
      });

      test('空の名前を設定できる', () => {
        const editor = new UnityAnimationEditor();

        editor.setName('Initial');
        editor.setName('');

        expect(editor.getName()).toBe('');
      });
    });

    describe('getFloatCurves', () => {
      test('すべてのFloat曲線を取得できる', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        const curves = editor.getFloatCurves();

        expect(curves).toHaveLength(2);
        expect(curves[0].attribute).toBe('m_LocalPosition.x');
        expect(curves[1].attribute).toBe('m_LocalPosition.y');
      });

      test('Float曲線がない場合は空の配列を返す', () => {
        const editor = new UnityAnimationEditor();

        const curves = editor.getFloatCurves();

        expect(curves).toEqual([]);
      });
    });

    describe('getCurve', () => {
      test('指定されたattributeとpathの曲線を取得できる', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        const curve = editor.getCurve('m_LocalPosition.x', 'GameObject');

        expect(curve).toBeDefined();
        expect(curve!.attribute).toBe('m_LocalPosition.x');
        expect(curve!.path).toBe('GameObject');
      });

      test('存在しない曲線の場合はundefinedを返す', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        const curve = editor.getCurve('nonexistent', 'path');

        expect(curve).toBeUndefined();
      });
    });

    describe('addCurve', () => {
      test('新しい曲線を追加できる', () => {
        const editor = new UnityAnimationEditor();
        const newCurve = createSampleFloatCurve();

        editor.addCurve(newCurve);

        expect(editor.getFloatCurves()).toHaveLength(1);
        expect(
          editor.getCurve('m_LocalPosition.z', 'TestObject'),
        ).toBeDefined();
      });

      test('既存の曲線を更新できる', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        const updatedCurve: FloatCurve = {
          attribute: 'm_LocalPosition.x',
          path: 'GameObject',
          keyframes: [createSampleKeyframe(0, 100)],
        };

        editor.addCurve(updatedCurve);

        const curve = editor.getCurve('m_LocalPosition.x', 'GameObject');
        expect(curve!.keyframes).toHaveLength(1);
        expect(curve!.keyframes[0].value).toBe(100);
      });
    });

    describe('removeCurve', () => {
      test('指定された曲線を削除できる', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        editor.removeCurve('m_LocalPosition.x', 'GameObject');

        expect(editor.getFloatCurves()).toHaveLength(1);
        expect(
          editor.getCurve('m_LocalPosition.x', 'GameObject'),
        ).toBeUndefined();
      });

      test('存在しない曲線を削除しようとしても問題ない', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        editor.removeCurve('nonexistent', 'path');

        expect(editor.getFloatCurves()).toHaveLength(2);
      });
    });

    describe('addKeyframe', () => {
      test('既存の曲線にキーフレームを追加できる', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        const newKeyframe = createSampleKeyframe(0.5, 0.5);
        editor.addKeyframe('m_LocalPosition.x', 'GameObject', newKeyframe);

        const curve = editor.getCurve('m_LocalPosition.x', 'GameObject');
        expect(curve!.keyframes).toHaveLength(3);

        // キーフレームが時間順にソートされているか確認
        expect(curve!.keyframes[0].time).toBe(0);
        expect(curve!.keyframes[1].time).toBe(0.5);
        expect(curve!.keyframes[2].time).toBe(1);
      });

      test('存在しない曲線にキーフレームを追加しようとしても問題ない', () => {
        const editor = new UnityAnimationEditor();

        const newKeyframe = createSampleKeyframe(0, 0);
        editor.addKeyframe('nonexistent', 'path', newKeyframe);

        expect(editor.getFloatCurves()).toHaveLength(0);
      });
    });

    describe('removeKeyframe', () => {
      test('指定された時間のキーフレームを削除できる', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        editor.removeKeyframe('m_LocalPosition.x', 'GameObject', 0);

        const curve = editor.getCurve('m_LocalPosition.x', 'GameObject');
        expect(curve!.keyframes).toHaveLength(1);
        expect(curve!.keyframes[0].time).toBe(1);
      });

      test('時間の近似値でキーフレームを削除できる', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        // 0.0001の誤差があってもキーフレームを削除できる
        editor.removeKeyframe('m_LocalPosition.x', 'GameObject', 0.0001);

        const curve = editor.getCurve('m_LocalPosition.x', 'GameObject');
        expect(curve!.keyframes).toHaveLength(1);
      });

      test('存在しない時間のキーフレームを削除しようとしても問題ない', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        editor.removeKeyframe('m_LocalPosition.x', 'GameObject', 999);

        const curve = editor.getCurve('m_LocalPosition.x', 'GameObject');
        expect(curve!.keyframes).toHaveLength(2);
      });
    });

    describe('exportToYaml', () => {
      test('YAMLを出力できる', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        const result = editor.exportToYaml();

        expect(result).toContain('AnimationClip:');
        expect(result).toContain('m_Name: TestAnimation');
        expect(result).toContain('m_FloatCurves:');
      });

      test('変更されたアニメーション名が反映される', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);
        editor.setName('ModifiedAnimation');

        const result = editor.exportToYaml();

        expect(result).toContain('m_Name: ModifiedAnimation');
      });

      test('追加された曲線が反映される', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(simpleYamlWithoutFloatCurves);

        const newCurve = createSampleFloatCurve();
        editor.addCurve(newCurve);

        const result = editor.exportToYaml();

        expect(result).toContain('m_LocalPosition.z');
        expect(result).toContain('TestObject');
      });

      test('削除された曲線が反映される', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        editor.removeCurve('m_LocalPosition.x', 'GameObject');

        const result = editor.exportToYaml();

        expect(result).not.toContain('m_LocalPosition.x');
        expect(result).toContain('m_LocalPosition.y');
      });

      test('Infinityを含むキーフレームが正しく出力される', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(sampleAnimationYaml);

        const result = editor.exportToYaml();

        expect(result).toContain('inSlope: Infinity');
        expect(result).toContain('outSlope: Infinity');
      });
    });

    describe('統合テスト', () => {
      test('読み込み・編集・出力のフルサイクル', () => {
        const editor = new UnityAnimationEditor();

        // 読み込み
        editor.loadFromYaml(sampleAnimationYaml);

        // 編集
        editor.setName('EditedAnimation');
        editor.removeCurve('m_LocalPosition.x', 'GameObject');

        const newCurve = createSampleFloatCurve();
        editor.addCurve(newCurve);

        const newKeyframe = createSampleKeyframe(0.5, 50);
        editor.addKeyframe('m_LocalPosition.z', 'TestObject', newKeyframe);

        // 出力
        const result = editor.exportToYaml();

        expect(result).toContain('m_Name: EditedAnimation');
        expect(result).not.toContain('m_LocalPosition.x');
        expect(result).toContain('m_LocalPosition.y');
        expect(result).toContain('m_LocalPosition.z');
        expect(result).toContain('TestObject');
      });

      test('複数の曲線を追加・削除・編集', () => {
        const editor = new UnityAnimationEditor();
        editor.loadFromYaml(simpleYamlWithoutFloatCurves);

        // 複数の曲線を追加
        const curve1: FloatCurve = {
          attribute: 'm_LocalPosition.x',
          path: 'Object1',
          keyframes: [createSampleKeyframe(0, 0), createSampleKeyframe(1, 10)],
        };

        const curve2: FloatCurve = {
          attribute: 'm_LocalPosition.y',
          path: 'Object1',
          keyframes: [createSampleKeyframe(0, 0), createSampleKeyframe(1, 5)],
        };

        const curve3: FloatCurve = {
          attribute: 'm_LocalRotation.z',
          path: 'Object2',
          keyframes: [createSampleKeyframe(0, 0), createSampleKeyframe(1, 90)],
        };

        editor.addCurve(curve1);
        editor.addCurve(curve2);
        editor.addCurve(curve3);

        expect(editor.getFloatCurves()).toHaveLength(3);

        // キーフレームを追加
        editor.addKeyframe(
          'm_LocalPosition.x',
          'Object1',
          createSampleKeyframe(0.5, 5),
        );

        // 曲線を削除
        editor.removeCurve('m_LocalPosition.y', 'Object1');

        expect(editor.getFloatCurves()).toHaveLength(2);

        // キーフレームを削除
        editor.removeKeyframe('m_LocalPosition.x', 'Object1', 0.5);

        const curve = editor.getCurve('m_LocalPosition.x', 'Object1');
        expect(curve!.keyframes).toHaveLength(2);

        // 最終的な出力確認
        const result = editor.exportToYaml();
        expect(result).toContain('m_LocalPosition.x');
        expect(result).not.toContain('m_LocalPosition.y');
        expect(result).toContain('m_LocalRotation.z');
        expect(result).toContain('Object1');
        expect(result).toContain('Object2');
      });
    });
  });
});
