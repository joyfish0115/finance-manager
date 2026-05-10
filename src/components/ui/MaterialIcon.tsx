/**
 * Google Material Symbols 圖示包裝元件。
 *
 * 使用方式：<MaterialIcon name="restaurant" size={22} />
 * 圖示名稱列表：https://fonts.google.com/icons
 *
 * 字型已在 index.html 載入（Material Symbols Rounded，圓潤風格）。
 */

interface Props {
  /** Material Symbol 名稱（用底線分隔，例如 "shopping_bag"、"directions_subway"） */
  name: string
  size?: number
  /** 是否填滿（預設為線條風格） */
  filled?: boolean
  className?: string
}

export function MaterialIcon({
  name,
  size = 22,
  filled = false,
  className = '',
}: Props) {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
