'use client'

import { wonShort } from '@/lib/utils'

interface DonutData {
  label: string
  value: number
  color: string
}

export function DonutChart({ data }: { data: DonutData[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  // 도넛 반지름 및 둘레
  const radius = 50
  const circumference = 2 * Math.PI * radius
  
  let accumulatedPercent = 0

  return (
    <div className="flex flex-col gap-4 wide:flex-row wide:items-center">
      <div className="relative w-36 h-36 shrink-0 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            className="dark:stroke-slate-800"
            strokeWidth="12"
          />
          {/* Data slices */}
          {data.map((item, index) => {
            if (total === 0 || item.value === 0) return null
            const pct = (item.value / total) * 100
            const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`
            const strokeDashoffset = `${-(accumulatedPercent / 100) * circumference}`
            accumulatedPercent += pct

            return (
              <circle
                key={index}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[0.6875rem] text-slate-400 font-semibold uppercase tracking-wider">총합</p>
          <p className="text-sm font-extrabold text-ink dark:text-white tabular-nums">{wonShort(total)}원</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
        {data.map((item, index) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
          return (
            <div key={index} className="flex items-center gap-2 p-1.5 rounded-xs bg-slate-50 dark:bg-slate-800/40">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 dark:text-slate-300 truncate flex-1 font-medium">{item.label}</span>
              <span className="font-bold text-ink dark:text-white tabular-nums shrink-0">{pct}%</span>
            </div>
          )
        })}
        {data.length === 0 && (
          <p className="col-span-2 text-center text-slate-400 py-6">기록이 없습니다.</p>
        )}
      </div>
    </div>
  )
}

interface AreaData {
  label: string
  value: number
}

export function AreaChart({ data }: { data: AreaData[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const width = 500
  const height = 140
  const paddingX = 30
  const paddingY = 20

  const chartW = width - paddingX * 2
  const chartH = height - paddingY * 2

  // 좌표 계산
  const points = data.map((d, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartW
    const y = height - paddingY - (d.value / maxVal) * chartH
    return { x, y }
  })

  // SVG 패스 생성
  let linePath = ''
  let fillPath = ''

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} `
    for (let i = 1; i < points.length; i++) {
      linePath += `L ${points[i].x} ${points[i].y} `
    }

    fillPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
  }

  return (
    <div className="w-full">
      <svg className="w-full h-auto" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line
          x1={paddingX}
          y1={height - paddingY - chartH}
          x2={width - paddingX}
          y2={height - paddingY - chartH}
          stroke="#F1F5F9"
          className="dark:stroke-slate-800/60"
          strokeDasharray="4 4"
        />
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="#E2E8F0"
          className="dark:stroke-slate-800"
        />

        {/* Area fill */}
        {fillPath && <path d={fillPath} fill="url(#areaGrad)" />}

        {/* Line path */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Dots */}
        {points.map((pt, index) => (
          <g key={index}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#2563EB"
              stroke="#FFFFFF"
              className="dark:stroke-slate-900"
              strokeWidth="2"
            />
            {/* Tooltip value */}
            <text
              x={pt.x}
              y={pt.y - 8}
              textAnchor="middle"
              className="text-[0.5625rem] font-bold fill-slate-500 dark:fill-slate-400 tabular-nums"
            >
              {wonShort(data[index].value)}
            </text>
          </g>
        ))}

        {/* X Axis Labels */}
        {data.map((d, index) => {
          const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartW
          return (
            <text
              key={index}
              x={x}
              y={height - 4}
              textAnchor="middle"
              className="text-[0.625rem] font-medium fill-slate-400 dark:fill-slate-500"
            >
              {d.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-700 dark:text-slate-300 truncate">{label}</span>
        <span className="text-blue-600 dark:text-blue-400 tabular-nums">{pct.toFixed(0)}% <span className="text-slate-400 font-normal dark:text-slate-500">({wonShort(value)} / {wonShort(max)})</span></span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
