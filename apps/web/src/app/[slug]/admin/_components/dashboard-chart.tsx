'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type Period = 'week' | 'month' | 'year'

interface TimelineData {
  date: string
  applications: number
  adoptions: number
}

interface DashboardChartProps {
  data: TimelineData[]
  period: Period
  onPeriodChange: (period: Period) => void
}

const periodLabels: Record<Period, string> = {
  week: 'Semana',
  month: 'Mês',
  year: 'Ano',
}

const monthNames = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function formatDateLabel(date: string, period: Period): string {
  if (period === 'week') {
    // Format: YYYY-MM-DD -> DD/MM
    const parts = date.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`
    }
    return date
  } else if (period === 'month') {
    // Format: YYYY-WNN -> "DD-DD Mmm" (week range with month)
    const match = date.match(/(\d{4})-W(\d+)$/)
    if (match?.[1] && match?.[2]) {
      const year = parseInt(match[1], 10)
      const weekNum = parseInt(match[2], 10)
      // Calculate the Monday of that week
      const jan4 = new Date(year, 0, 4)
      const dayOfWeek = jan4.getDay() || 7
      const monday = new Date(jan4)
      monday.setDate(jan4.getDate() - dayOfWeek + 1 + (weekNum - 1) * 7)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      const startDay = monday.getDate()
      const endDay = sunday.getDate()
      const monthAbbr = monthNames[monday.getMonth()]

      return `${startDay}-${endDay} ${monthAbbr}`
    }
    return date
  } else {
    // Format: YYYY-MM -> Mês abreviado
    const parts = date.split('-')
    if (parts.length === 2 && parts[1]) {
      const monthIndex = parseInt(parts[1], 10) - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        return monthNames[monthIndex]!
      }
    }
    return date
  }
}

export function DashboardChart({
  data,
  period,
  onPeriodChange,
}: DashboardChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    label: formatDateLabel(item.date, period),
  }))

  const hasData = data.some(
    (item) => item.applications > 0 || item.adoptions > 0
  )

  // Use actual color values for Recharts compatibility
  const primaryColor = '#e35915'
  const successColor = '#16a34a'
  const borderColor = '#9ab4d1'
  const mutedFgColor = '#8b5a2b'

  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Candidaturas e Adoções
        </CardTitle>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(value) => {
            if (value) onPeriodChange(value as Period)
          }}
          className="bg-muted/50 rounded-lg p-0.5"
        >
          {(['week', 'month', 'year'] as const).map((p) => (
            <ToggleGroupItem
              key={p}
              value={p}
              aria-label={`Ver dados de ${periodLabels[p].toLowerCase()}`}
              className="data-[state=on]:bg-background data-[state=on]:text-foreground h-7 rounded-md px-2.5 text-xs font-medium transition-colors data-[state=on]:shadow-sm"
            >
              {periodLabels[p]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Nenhum dado disponível para este período
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={borderColor}
                opacity={0.5}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: mutedFgColor }}
                tickLine={false}
                axisLine={{ stroke: borderColor }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: mutedFgColor }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{
                  color: '#783201',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
                itemStyle={{
                  color: mutedFgColor,
                  fontSize: '14px',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '12px' }}
                formatter={(value) => (
                  <span className="text-muted-foreground text-sm">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="applications"
                name="Candidaturas"
                stroke={primaryColor}
                strokeWidth={2}
                dot={{ fill: primaryColor, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: primaryColor }}
              />
              <Line
                type="monotone"
                dataKey="adoptions"
                name="Adoções"
                stroke={successColor}
                strokeWidth={2}
                dot={{ fill: successColor, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: successColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
