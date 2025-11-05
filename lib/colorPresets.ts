/**
 * 営業メールの返信率を高めるためのカラープリセット
 * 各プリセットは心理学的な効果を考慮して選定
 */

export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  useCase: string;
  psychologicalEffect: string;
}

export const colorPresets: ColorPreset[] = [
  {
    id: 'professional',
    name: 'プロフェッショナル',
    description: '信頼感と行動喚起のバランス',
    primaryColor: '#1E3A8A', // ネイビーブルー
    accentColor: '#F97316', // オレンジ
    useCase: 'B2B営業、コンサルティング提案',
    psychologicalEffect: '信頼性・専門性・行動促進'
  },
  {
    id: 'tech',
    name: 'テクノロジー',
    description: '革新的で成長志向',
    primaryColor: '#0F172A', // ダークブルー
    accentColor: '#10B981', // グリーン
    useCase: 'IT企業、スタートアップ向け',
    psychologicalEffect: '革新性・成長・信頼'
  },
  {
    id: 'energetic',
    name: 'エネルギッシュ',
    description: '緊急性と重要性を強調',
    primaryColor: '#374151', // ダークグレー
    accentColor: '#DC2626', // レッド
    useCase: '期限付きオファー、限定提案',
    psychologicalEffect: '緊急性・重要性・行動喚起'
  },
  {
    id: 'friendly',
    name: 'フレンドリー',
    description: '親しみやすく明るい印象',
    primaryColor: '#1D4ED8', // ブルー
    accentColor: '#FBBF24', // イエロー
    useCase: '初回コンタクト、関係構築',
    psychologicalEffect: '安心感・親近感・ポジティブ'
  },
  {
    id: 'luxury',
    name: 'ラグジュアリー',
    description: '高級感と価値を演出',
    primaryColor: '#1F2937', // ブラック
    accentColor: '#D97706', // ゴールド
    useCase: 'プレミアム商品、高額サービス',
    psychologicalEffect: '高級感・品質・独占性'
  },
  {
    id: 'corporate',
    name: 'コーポレート',
    description: '大企業向けの堅実な配色',
    primaryColor: '#1E40AF', // ロイヤルブルー
    accentColor: '#059669', // エメラルド
    useCase: '大手企業、官公庁向け',
    psychologicalEffect: '堅実性・信頼・安定'
  },
  {
    id: 'modern',
    name: 'モダン',
    description: '洗練された現代的デザイン',
    primaryColor: '#6366F1', // インディゴ
    accentColor: '#EC4899', // ピンク
    useCase: 'クリエイティブ業界、マーケティング',
    psychologicalEffect: '創造性・革新・魅力'
  },
  {
    id: 'trustworthy',
    name: 'トラストワーシー',
    description: '最も信頼される組み合わせ',
    primaryColor: '#0C4A6E', // ディープブルー
    accentColor: '#0891B2', // シアン
    useCase: '金融、法律、医療分野',
    psychologicalEffect: '信頼性・専門性・安心'
  }
];

export const getPresetById = (id: string): ColorPreset | undefined => {
  return colorPresets.find(preset => preset.id === id);
};

export const getDefaultPreset = (): ColorPreset => {
  return colorPresets[0]; // プロフェッショナルをデフォルトに
};