'use client'

import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

export const PALETTE = ['#4A1E48', '#A62B4E', '#7FA06C', '#C9952B', '#8E6C8A', '#D97A8E', '#B3C6A0']

type Series = { key: string; name: string; color?: string; stack?: string }
type Row = Record<string, string | number>

const axis = { fontSize: 12, fill: '#7A5C4E' }
const tip = { contentStyle: { borderRadius: 10, border: '1px solid rgba(74,30,72,.14)', fontSize: 13 } }

export function Bars({ data, x, series, tall, money }: { data: Row[]; x: string; series: Series[]; tall?: boolean; money?: boolean }) {
  if (!data.length) return <Empty />
  return (
    <div className={tall ? 'chart tall' : 'chart'}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(74,30,72,.1)" />
          <XAxis dataKey={x} tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={money ? (v) => `₹${v}` : undefined} />
          <Tooltip {...tip} cursor={{ fill: 'rgba(74,30,72,.05)' }} formatter={money ? (v) => `₹${Number(v).toLocaleString('en-IN')}` : undefined} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} stackId={s.stack} fill={s.color ?? PALETTE[i]} radius={s.stack ? 0 : [6, 6, 0, 0]} maxBarSize={42} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Lines({ data, x, series, money }: { data: Row[]; x: string; series: Series[]; money?: boolean }) {
  if (!data.length) return <Empty />
  return (
    <div className="chart">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(74,30,72,.1)" />
          <XAxis dataKey={x} tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={money ? (v) => `₹${v}` : undefined} />
          <Tooltip {...tip} formatter={money ? (v) => `₹${Number(v).toLocaleString('en-IN')}` : undefined} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color ?? PALETTE[i]} strokeWidth={2.5} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  const rows = data.filter((d) => d.value > 0)
  if (!rows.length) return <Empty />
  return (
    <div className="chart">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" startAngle={90} endAngle={-270} innerRadius={52} outerRadius={84} paddingAngle={rows.length > 1 ? 2 : 0} stroke="none">
            {rows.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip {...tip} />
          <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function Empty() {
  return <div className="chart empty" style={{ display: 'grid', placeItems: 'center' }}>No data yet</div>
}
