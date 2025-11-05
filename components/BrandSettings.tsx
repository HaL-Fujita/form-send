"use client";

interface BrandSettingsProps {
  primaryColor: string;
  accentColor: string;
  font: string;
  onPrimaryColorChange: (value: string) => void;
  onAccentColorChange: (value: string) => void;
  onFontChange: (value: string) => void;
}

// 色の名前を取得する関数
function getColorName(hex: string): string {
  const color = hex.toLowerCase();

  // 基本色の判定
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // グレースケール
  if (max - min < 30) {
    if (max < 50) return "黒";
    if (max < 100) return "濃いグレー";
    if (max < 180) return "グレー";
    if (max < 220) return "明るいグレー";
    return "白";
  }

  // 色相による判定
  if (r > g && r > b) {
    if (g > b + 30) return "オレンジ";
    return "赤";
  }
  if (g > r && g > b) {
    if (b > r + 30) return "水色";
    if (r > b + 30) return "黄緑";
    return "緑";
  }
  if (b > r && b > g) {
    if (r > g + 30) return "紫";
    if (g > r + 30) return "青緑";
    return "青";
  }
  if (r > 200 && g > 200) return "黄色";
  if (r > 150 && b > 150) return "ピンク";

  return "カスタム";
}

export default function BrandSettings({
  primaryColor,
  accentColor,
  font,
  onPrimaryColorChange,
  onAccentColorChange,
  onFontChange,
}: BrandSettingsProps) {
  return (
    <div className="space-y-3">
      {/* カラー設定 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="primaryColor" className="block text-xs font-medium text-gray-700 mb-1.5">
            プライマリカラー
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="primaryColor"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
              title="クリックして色を変更"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 truncate">
                {getColorName(primaryColor)}
              </div>
              <div className="text-xs text-gray-500">{primaryColor}</div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="accentColor" className="block text-xs font-medium text-gray-700 mb-1.5">
            アクセントカラー
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="accentColor"
              value={accentColor}
              onChange={(e) => onAccentColorChange(e.target.value)}
              className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
              title="クリックして色を変更"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 truncate">
                {getColorName(accentColor)}
              </div>
              <div className="text-xs text-gray-500">{accentColor}</div>
            </div>
          </div>
        </div>
      </div>

      {/* フォント設定 */}
      <div>
        <label htmlFor="font" className="block text-xs font-medium text-gray-700 mb-1.5">
          フォント
        </label>
        <select
          id="font"
          value={font}
          onChange={(e) => onFontChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <optgroup label="おすすめ（日本語対応）">
            <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif">システムフォント（推奨）</option>
            <option value="'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif">ヒラギノ角ゴ / メイリオ</option>
            <option value="'Yu Gothic', YuGothic, 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif">游ゴシック</option>
          </optgroup>
          <optgroup label="ゴシック体（Sans-serif）">
            <option value="Arial, Helvetica, sans-serif">Arial</option>
            <option value="Helvetica, Arial, sans-serif">Helvetica</option>
            <option value="Verdana, Geneva, sans-serif">Verdana</option>
            <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
            <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
            <option value="sans-serif">Sans-serif（標準）</option>
          </optgroup>
          <optgroup label="明朝体（Serif）">
            <option value="Georgia, 'Times New Roman', serif">Georgia</option>
            <option value="'Times New Roman', Times, serif">Times New Roman</option>
            <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
            <option value="serif">Serif（標準）</option>
          </optgroup>
          <optgroup label="その他">
            <option value="'Courier New', Courier, monospace">Courier New（等幅）</option>
            <option value="Impact, Charcoal, sans-serif">Impact（太字）</option>
          </optgroup>
        </select>
      </div>
    </div>
  );
}
