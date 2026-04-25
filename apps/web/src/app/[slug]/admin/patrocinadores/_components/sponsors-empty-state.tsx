import { Handshake } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export function SponsorsEmptyState() {
  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
      <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="bg-primary/10 mb-4 rounded-full p-4">
          <Handshake className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">
          Nenhum patrocinador ainda
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Adicione logos e links dos patrocinadores que apoiam sua ONG. Eles
          aparecerão no seu site de adoção.
        </p>
      </CardContent>
    </Card>
  )
}
