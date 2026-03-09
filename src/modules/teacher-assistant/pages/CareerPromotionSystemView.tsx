import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
  FileUser,
  GraduationCap,
  ThumbsUp,
  User,
  Users,
} from "lucide-react"
import { Cell, Pie, PieChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart"

const careerLevels = [
  { name: "Profesor Cátedra", color: "#D9D9D9", showArrow: false },
  { name: "Instructor", color: "#B8BEC9", showArrow: false },
  { name: "Profesor Asistente", color: "#5D86B3", showArrow: true },
  { name: "Profesor Asociado", color: "#2F5E8F", showArrow: true },
  { name: "Profesor Titular", color: "#1A3554", showArrow: true },
]

const promotionTimeData = [
  { level: "Titular", years: 5.2, fill: "#1A3554" },
  { level: "Asociado", years: 4.8, fill: "#306898" },
  { level: "Asistente", years: 3.5, fill: "#78A5D4" },
  { level: "Instructor", years: 2.1, fill: "#CC8A42" },
]

const evaluationCriteriaData = [
  { key: "teaching", name: "Docencia", value: 40, fill: "#3A78B5" },
  { key: "research", name: "Investigación", value: 35, fill: "#1A3554" },
  { key: "extension", name: "Extensión", value: 25, fill: "#CC8A42" },
]

const annualPromotionsData = [
  { year: "2020", count: 18 },
  { year: "2021", count: 22 },
  { year: "2022", count: 25 },
  { year: "2023", count: 30 },
]

const criteriaChartConfig = {
  teaching: { label: "Docencia", color: "#3A78B5" },
  research: { label: "Investigación", color: "#1A3554" },
  extension: { label: "Extensión", color: "#CC8A42" },
} satisfies ChartConfig

const annualChartConfig = {
  count: { label: "Promociones", color: "#306898" },
} satisfies ChartConfig

export default function CareerPromotionSystemView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sistema de Carreras y Promoción Docente</h1>
        <p className="text-sm text-muted-foreground mt-1">Vista estratégica con indicadores mock para seguimiento del crecimiento profesoral.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Escalafón Profesoral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {careerLevels.map((level, index) => (
                <div
                  key={level.name}
                  className="rounded-md px-3 py-2 text-sm font-medium text-white flex items-center justify-between"
                  style={{
                    backgroundColor: level.color,
                    marginLeft: `${index * 12}px`,
                    width: `calc(100% - ${index * 12}px)`,
                  }}
                >
                  <span>{`${index + 1}. ${level.name}`}</span>
                  {level.showArrow ? <ArrowUp className="h-4 w-4" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiempo Promedio de Promoción</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[240px] w-full">
                <BarChart data={promotionTimeData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" domain={[0, 6]} tickLine={false} axisLine={false} />
                  <YAxis dataKey="level" type="category" tickLine={false} axisLine={false} width={90} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideIndicator
                        formatter={(value, name) => (
                          <span className="font-medium text-zinc-200">{`${String(name)}: ${value} años`}</span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="years" radius={6}>
                    {promotionTimeData.map((entry) => (
                      <Cell key={entry.level} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="years" position="right" formatter={(value: number) => `${value} años`} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasa de Éxito</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <ThumbsUp className="h-8 w-8 text-green-700" />
              </div>
              <p className="text-2xl font-bold text-green-800">82% Aprobadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criterios de Evaluación Equilibrados</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={criteriaChartConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideIndicator
                        hideLabel
                        formatter={(value, name) => (
                          <span className="font-medium text-zinc-200">{`${String(name)}: ${value}%`}</span>
                        )}
                      />
                    }
                  />
                  <Pie data={evaluationCriteriaData} dataKey="value" nameKey="name" outerRadius={95} />
                  <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluación 360°</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto h-[250px] max-w-[320px]">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 250" fill="none" aria-hidden>
                  <path d="M160 52 C 225 52, 245 120, 208 175" stroke="#306898" strokeWidth="2" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead)" />
                  <path d="M112 175 C 75 120, 95 52, 160 52" stroke="#306898" strokeWidth="2" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead)" />
                  <path d="M112 175 C 152 222, 168 222, 208 175" stroke="#CC8A42" strokeWidth="2" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead)" />
                  <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#306898" />
                    </marker>
                  </defs>
                </svg>

                <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-xl border bg-background px-3 py-2 shadow-sm text-center w-40">
                  <Users className="mx-auto h-5 w-5 text-[#1A3554]" />
                  <p className="text-xs font-medium mt-1">Evaluación por Pares</p>
                </div>

                <div className="absolute left-1 top-36 rounded-xl border bg-background px-3 py-2 shadow-sm text-center w-40">
                  <GraduationCap className="mx-auto h-5 w-5 text-[#CC8A42]" />
                  <p className="text-xs font-medium mt-1">Evaluación Estudiantil</p>
                </div>

                <div className="absolute right-1 top-36 rounded-xl border bg-background px-3 py-2 shadow-sm text-center w-36">
                  <User className="mx-auto h-5 w-5 text-[#306898]" />
                  <p className="text-xs font-medium mt-1">Autoevaluación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trayectoria de Inserción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#D9E6F4] text-[#1A3554] flex items-center justify-center">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium">Evaluación por Pares</p>
                </div>

                <ArrowRight className="h-4 w-4 text-[#306898]" />

                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#F3E2CD] text-[#CC8A42] flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium">Evaluación Estudiantil</p>
                </div>

                <ArrowRight className="h-4 w-4 text-[#306898]" />

                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#D9E6F4] text-[#306898] flex items-center justify-center">
                    <FileUser className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium">Autoevaluación</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Promociones Anuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-end gap-2 text-xs font-medium text-[#1A3554]">
                <ArrowUpRight className="h-4 w-4" />
                <span>Meta 30+</span>
              </div>
              <ChartContainer config={annualChartConfig} className="h-[250px] w-full">
                <BarChart data={annualPromotionsData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} domain={[0, 35]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideIndicator
                        formatter={(value) => (
                          <span className="font-medium text-zinc-200">{`Promociones: ${value}`}</span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="count" radius={4}>
                    {annualPromotionsData.map((row) => (
                      <Cell key={row.year} fill={row.year === "2023" ? "#1A3554" : "#5D86B3"} />
                    ))}
                    <LabelList dataKey="count" position="top" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan de Desarrollo Individual - PID</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Objetivos Personalizados",
                  "Capacitación Continua",
                  "Mentoría Académica",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-[#306898]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
