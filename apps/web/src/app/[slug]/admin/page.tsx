import {
  ArrowRight,
  ArrowUpRight,
  Cat,
  FileText,
  Heart,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminPageProps {
  params: Promise<{ slug: string }>
}

interface QuickLink {
  title: string
  description: string
  href: string
  icon: React.ElementType
  gradient: string
  iconBg: string
  stats?: { value: string; label: string }
}

interface StatCard {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { slug } = await params

  const stats: StatCard[] = [
    {
      title: 'Gatos Disponíveis',
      value: '24',
      change: '+3 este mês',
      changeType: 'positive',
      icon: Cat,
    },
    {
      title: 'Adoções Realizadas',
      value: '156',
      change: '+12 este mês',
      changeType: 'positive',
      icon: Heart,
    },
    {
      title: 'Candidaturas',
      value: '48',
      change: '8 pendentes',
      changeType: 'neutral',
      icon: FileText,
    },
    {
      title: 'Voluntários',
      value: '12',
      change: '+2 este mês',
      changeType: 'positive',
      icon: Users,
    },
  ]

  const quickLinks: QuickLink[] = [
    {
      title: 'Gatos',
      description: 'Cadastrar e gerenciar gatos disponíveis para adoção',
      href: `/${slug}/admin/gatos`,
      icon: Cat,
      gradient: 'from-primary/10 via-primary/5 to-transparent',
      iconBg: 'bg-primary/15 text-primary',
      stats: { value: '24', label: 'disponíveis' },
    },
    {
      title: 'Adotados',
      description: 'Acompanhar histórico e termos de adoção',
      href: `/${slug}/admin/adotados`,
      icon: Heart,
      gradient: 'from-success/10 via-success/5 to-transparent',
      iconBg: 'bg-success/15 text-success',
      stats: { value: '156', label: 'total' },
    },
    {
      title: 'Formulários',
      description: 'Configurar perguntas para candidatos',
      href: `/${slug}/admin/formularios`,
      icon: FileText,
      gradient: 'from-info/10 via-info/5 to-transparent',
      iconBg: 'bg-info/15 text-info',
      stats: { value: '3', label: 'ativos' },
    },
    {
      title: 'Equipe',
      description: 'Gerenciar voluntários e administradores',
      href: `/${slug}/admin/usuarios`,
      icon: Users,
      gradient: 'from-warning/10 via-warning/5 to-transparent',
      iconBg: 'bg-warning/15 text-warning',
      stats: { value: '12', label: 'membros' },
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-display text-foreground text-2xl font-bold tracking-tight md:text-3xl">
          Bem-vindo de volta!
        </h1>
        <p className="text-muted-foreground">
          Aqui está um resumo das atividades da sua organização.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="animate-fade-in-up shadow-warm-sm relative overflow-hidden rounded-xl border-0"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      {stat.title}
                    </p>
                    <p className="text-display text-foreground mt-1 text-2xl font-bold">
                      {stat.value}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      {stat.changeType === 'positive' && (
                        <TrendingUp className="text-success h-3 w-3" />
                      )}
                      <p
                        className={`text-xs ${
                          stat.changeType === 'positive'
                            ? 'text-success'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {stat.change}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-2.5">
                    <Icon className="text-muted-foreground h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-display text-foreground text-lg font-semibold">
            Acesso Rápido
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link, index) => {
            const Icon = link.icon
            return (
              <a
                key={link.href}
                href={link.href}
                className="animate-fade-in-up group"
                style={{ animationDelay: `${(index + 4) * 50}ms` }}
              >
                <Card className="card-interactive shadow-warm-sm relative h-full overflow-hidden rounded-xl border-0">
                  {/* Background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  <CardContent className="relative flex items-start gap-4 p-5">
                    {/* Icon */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${link.iconBg} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-foreground font-semibold">
                          {link.title}
                        </h3>
                        <ArrowUpRight className="text-muted-foreground group-hover:text-primary h-4 w-4 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {link.description}
                      </p>
                      {link.stats && (
                        <p className="pt-1 text-xs">
                          <span className="text-foreground font-semibold">
                            {link.stats.value}
                          </span>{' '}
                          <span className="text-muted-foreground">
                            {link.stats.label}
                          </span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <Card
        className="animate-fade-in-up shadow-warm-sm rounded-xl border-0"
        style={{ animationDelay: '400ms' }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-display text-lg font-semibold">
              Atividade Recente
            </CardTitle>
            <a
              href={`/${slug}/admin/gatos`}
              className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors"
            >
              Ver tudo
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Placeholder items */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="hover:bg-muted/50 flex items-center gap-4 rounded-lg p-3 transition-colors"
              >
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                  <Cat className="text-muted-foreground h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">
                    Novo gato cadastrado
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Mimi foi adicionada ao sistema
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">2h atrás</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
