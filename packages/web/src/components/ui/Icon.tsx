export interface IconProps {
  name: string
  className?: string
  fill?: boolean
  size?: number
  style?: React.CSSProperties
}

export function Icon({ name, className = '', fill = false, size, style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        ...(fill ? { fontVariationSettings: "'FILL' 1" } : {}),
        ...(size ? { fontSize: `${size}px` } : {}),
        ...style,
      }}
    >
      {name}
    </span>
  )
}
