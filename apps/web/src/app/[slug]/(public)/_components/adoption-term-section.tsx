import { HeartHandshake, Home, ShieldCheck, Stethoscope } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AdoptionTermSectionProps {
  orgName: string
}

const pillars = [
  {
    title: 'Um lar protegido',
    description:
      'Telas, barreiras e transporte seguro fazem parte do compromisso com a integridade do gato.',
    icon: ShieldCheck,
    color: 'from-info to-info/70',
    iconColor: 'text-info-foreground',
  },
  {
    title: 'Cuidado por toda a vida',
    description:
      'A adoção considera uma convivência que pode chegar a 20 anos, com presença e responsabilidade.',
    icon: HeartHandshake,
    color: 'from-primary to-accent',
    iconColor: 'text-primary-foreground',
  },
  {
    title: 'Saúde em dia',
    description:
      'Acompanhamento veterinário, vacinação, vermifugação e castração no momento adequado.',
    icon: Stethoscope,
    color: 'from-success to-success/70',
    iconColor: 'text-success-foreground',
  },
  {
    title: 'Guarda responsável',
    description:
      'Mudanças, viagens e imprevistos devem sempre preservar o bem-estar e a segurança do animal.',
    icon: Home,
    color: 'from-warning to-accent',
    iconColor: 'text-warning-foreground',
  },
] as const

const clauseTitles = [
  'Compromisso para toda a vida',
  'Segurança e bem-estar',
  'Liberdade e espaço adequado',
  'Moradia autorizada',
  'Mudanças de residência',
  'Adaptação com outros animais',
  'Acordo de toda a família',
  'Períodos sem companhia',
  'Cuidados veterinários',
  'Tempo e despesas',
  'Conduta em caso de fuga',
  'Transferência de guarda',
  'Acompanhamento pós-adoção',
] as const

function getClauses(orgName: string) {
  const descriptions = [
    'Cuidar bem do gato adotado até o seu último dia de vida, considerando que gatos podem viver por até 20 anos.',
    'Adotar todas as medidas possíveis de segurança e bem-estar: telas em janelas, cercas ou muros adequados, caixa de transporte, água, alimento e local confortável para descanso.',
    'Nunca manter o animal preso a correntes, em cubículos ou em espaços incompatíveis com suas necessidades.',
    'Confirmar que, em imóvel alugado ou condomínio, não existe impedimento do proprietário, da imobiliária ou das regras do local para manter um animal de estimação.',
    'Ao mudar de residência, incluir o gato nas decisões e assegurar que ele possa acompanhar a família com proteção durante toda a vida.',
    'Quando houver outros animais na casa, realizar uma adaptação gradual e segura para prevenir conflitos e reduzir o estresse.',
    'Garantir que todas as pessoas que vivem ou venham a viver na residência respeitem os animais e estejam de acordo com a adoção.',
    'Não deixar o gato sozinho por mais de 12 horas sem providenciar uma pessoa responsável por seus cuidados, água e alimentação.',
    'Realizar acompanhamento veterinário periódico e manter vacinação, vermifugação e castração em dia, conforme a idade e a orientação profissional.',
    'Assumir as despesas e dedicar o tempo necessário para oferecer saúde, segurança e qualidade de vida ao animal.',
    `Em caso de fuga, comunicar imediatamente a ${orgName} e participar ativamente das buscas, adotando as medidas necessárias para localizar o animal.`,
    `Se uma situação grave impedir a continuidade da guarda, comunicar a ${orgName} antes de transferir o animal para outra pessoa, para que o novo responsável passe pelo processo de adoção.`,
    `Fornecer as informações solicitadas pela equipe da ${orgName} durante o acompanhamento pós-adoção e colaborar com o cuidado contínuo do gato.`,
  ]

  return clauseTitles.map((title, index) => ({
    title,
    description: descriptions[index],
  }))
}

export function AdoptionTermSection({ orgName }: AdoptionTermSectionProps) {
  const clauses = getClauses(orgName)

  return (
    <section
      id="termo-de-adocao"
      className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-primary/10 absolute top-10 -left-24 h-64 w-64 rounded-full blur-3xl" />
        <div className="bg-accent/10 absolute -right-24 bottom-10 h-72 w-72 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="border-foreground/8 shadow-foreground/5 overflow-hidden rounded-3xl border bg-white/75 shadow-2xl backdrop-blur-sm">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="from-primary via-primary/90 to-accent relative overflow-hidden bg-gradient-to-br p-8 text-white sm:p-10 lg:p-12">
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full border border-white/20" />
              <div className="absolute -top-7 -right-7 h-32 w-32 rounded-full border border-white/15" />
              <p className="mb-6 inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm">
                Compromisso compartilhado
              </p>
              <h2
                className="max-w-md text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                O termo protege uma história que está só começando.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
                Mais que uma assinatura, ele deixa claro o cuidado esperado de
                quem adota e como a {orgName} acompanha o bem-estar de cada
                gato.
              </p>
              <div className="mt-10 border-l-2 border-white/35 pl-5">
                <p className="text-sm leading-relaxed text-white/80">
                  Leia os compromissos com calma. A adoção responsável começa
                  antes da chegada ao novo lar.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                O que você assume ao adotar
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="border-foreground/8 bg-background/35 rounded-2xl border p-4"
                  >
                    <div
                      className={cn(
                        'mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
                        pillar.color
                      )}
                    >
                      <pillar.icon
                        className={cn('h-4.5 w-4.5', pillar.iconColor)}
                      />
                    </div>
                    <h3 className="font-display text-foreground font-semibold">
                      {pillar.title}
                    </h3>
                    <p className="text-foreground/70 mt-1 text-sm leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-foreground/8 border-t bg-white/55 p-6 sm:p-8 lg:p-10">
            <div className="mb-7 max-w-3xl">
              <p className="text-primary text-sm font-semibold tracking-wider uppercase">
                As 13 cláusulas, em linguagem clara
              </p>
              <h3
                className="text-foreground mt-2 text-2xl font-bold sm:text-3xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Um acordo para toda a vida do gato
              </h3>
              <p className="text-foreground/70 mt-3 leading-relaxed">
                Abra cada item para conhecer os compromissos previstos no termo
                de adoção responsável.
              </p>
            </div>

            <div className="grid items-start gap-3 lg:grid-cols-2">
              {clauses.map((clause, index) => (
                <details
                  key={clause.title}
                  className="group border-foreground/10 open:border-primary/25 open:bg-primary/5 rounded-2xl border bg-white/80 transition-colors"
                >
                  <summary className="focus-visible:ring-primary flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-4 text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                    <span className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-foreground flex-1 text-sm font-semibold">
                      {clause.title}
                    </span>
                    <span className="text-primary text-xl leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="text-foreground/75 border-foreground/8 mx-4 border-t px-11 py-4 text-sm leading-relaxed">
                    {clause.description}
                  </p>
                </details>
              ))}
            </div>

            <div className="border-primary/15 bg-primary/5 mt-8 rounded-2xl border p-5 sm:p-6">
              <p className="text-foreground/80 text-sm leading-relaxed">
                O descumprimento dos compromissos pode levar o animal de volta à
                guarda da {orgName}. A equipe poderá acompanhar a adoção e
                adotar as medidas cabíveis para proteger o gato. Este conteúdo é
                informativo; a versão do termo apresentada para assinatura no
                momento da adoção é o documento aplicável ao processo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
