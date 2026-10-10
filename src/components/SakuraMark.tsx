type SakuraMarkProps = {
  className?: string
  size?: number
}

export default function SakuraMark({ className, size = 28 }: SakuraMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {[0, 72, 144, 216, 288].map((angle) => (
        <path
          key={angle}
          d="M16 16C13.7 13.9 10.9 10.5 12.1 6.9C12.5 5.7 13.6 4.7 14.6 4L16 6L17.4 4C18.4 4.7 19.5 5.7 19.9 6.9C21.1 10.5 18.3 13.9 16 16Z"
          fill="currentColor"
          transform={`rotate(${angle} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="2.1" fill="#FFF9F2" />
    </svg>
  )
}
