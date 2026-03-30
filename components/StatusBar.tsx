'use client'

type StatusBarProps = {
  capacity: number
  filled: number
}

export default function StatusBar({ capacity, filled }: StatusBarProps) {
  const remaining = capacity - filled
  const pct = capacity > 0 ? Math.min((filled / capacity) * 100, 100) : 0
  const isFull = remaining <= 0

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
          参加状況
        </span>
        <span
          className="text-sm font-bold rounded-full px-3 py-0.5"
          style={{
            background: isFull ? '#ff4d4f' : '#06C755',
            color: '#fff',
          }}
        >
          {isFull ? '満席' : `残り${remaining}席`}
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: '10px', background: '#e5e7eb' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isFull ? '#ff4d4f' : '#06C755',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: '#888' }}>
          {filled}名参加中
        </span>
        <span className="text-xs" style={{ color: '#888' }}>
          定員{capacity}名
        </span>
      </div>
    </div>
  )
}
