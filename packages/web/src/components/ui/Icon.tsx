interface IconProps {
  name: string
  className?: string
  fill?: boolean
  size?: number
}

export function Icon({ name, className = '', fill = false, size }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        ...(fill ? { fontVariationSettings: "'FILL' 1" } : {}),
        ...(size ? { fontSize: `${size}px` } : {}),
      }}
    >
      {name}
    </span>
  )
}
