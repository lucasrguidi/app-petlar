'use client'

import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ApplicationStepperStep {
  id: number
  label: string
  shortLabel?: string
}

interface ApplicationStepperProps {
  currentStep: number
  steps: ApplicationStepperStep[]
  className?: string
}

const defaultSteps: ApplicationStepperStep[] = [
  { id: 1, label: 'Seus Dados', shortLabel: 'Dados' },
  { id: 2, label: 'Perguntas', shortLabel: 'Perguntas' },
  { id: 3, label: 'Confirmação', shortLabel: 'Confirmar' },
]

export function ApplicationStepper({
  currentStep,
  steps = defaultSteps,
  className,
}: ApplicationStepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          const isPending = currentStep < step.id
          const isLast = index === steps.length - 1

          return (
            <div
              key={step.id}
              className={cn('flex items-center', !isLast && 'flex-1')}
            >
              {/* Step Circle + Label */}
              <div className="relative flex flex-col items-center">
                {/* Glow effect for active step */}
                {isActive && (
                  <div
                    className={cn(
                      'absolute -inset-1 rounded-full',
                      'bg-gradient-to-r from-primary/30 to-accent/30',
                      'animate-pulse blur-md'
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Circle */}
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full',
                    'text-sm font-semibold',
                    'transition-all duration-300 ease-out',
                    'ring-4 ring-white/80',
                    isCompleted && [
                      'bg-gradient-to-br from-emerald-400 to-emerald-500',
                      'text-white',
                      'shadow-lg shadow-emerald-500/25',
                    ],
                    isActive && [
                      'bg-gradient-to-br from-primary to-accent',
                      'text-white',
                      'shadow-xl shadow-primary/30',
                      'scale-110',
                    ],
                    isPending && [
                      'border-2 border-muted',
                      'bg-white',
                      'text-muted-foreground/60',
                    ]
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Label - hidden on small mobile */}
                <span
                  className={cn(
                    'mt-2 text-center text-xs font-medium',
                    'transition-all duration-300',
                    'hidden min-[400px]:block',
                    isCompleted && 'text-emerald-600',
                    isActive && 'font-semibold text-foreground',
                    isPending && 'text-muted-foreground/50'
                  )}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">
                    {step.shortLabel || step.label}
                  </span>
                </span>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="relative mx-2 h-1 flex-1 sm:mx-3">
                  {/* Background line */}
                  <div
                    className={cn(
                      'absolute inset-0 rounded-full',
                      'bg-muted/40'
                    )}
                  />

                  {/* Progress line */}
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      'transition-all duration-500 ease-out',
                      isCompleted
                        ? 'w-full bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : isActive
                          ? 'w-1/2 bg-gradient-to-r from-primary to-accent/50'
                          : 'w-0'
                    )}
                  />

                  {/* Animated pulse on active line */}
                  {isActive && (
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 w-1/2 rounded-full',
                        'bg-gradient-to-r from-primary/0 via-white/40 to-transparent',
                        'animate-[shimmer_2s_infinite]'
                      )}
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: Current step indicator */}
      <div className="mt-3 text-center min-[400px]:hidden">
        <span className="text-xs font-medium text-muted-foreground/70">
          Etapa {currentStep} de {steps.length}:
        </span>
        <span className="ml-1 text-xs font-semibold text-foreground">
          {steps.find((s) => s.id === currentStep)?.label}
        </span>
      </div>
    </div>
  )
}
