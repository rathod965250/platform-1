'use client'

export function PartnerLogosSection() {
  // Placeholder logos - replace with actual logos or images
  const logos = [
    'NaviAl',
    'Lumora',
    'NovaTech',
    'VitaHealth',
    'NaviAl',
    'Lumora',
    'NovaTech',
    'VitaHealth',
    'NaviAl',
    'Lumora',
    'NovaTech',
    'VitaHealth',
  ]

  return (
    <section className="py-12 md:py-16 bg-background border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center flex-wrap gap-8 md:gap-12 lg:gap-16">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors text-sm md:text-base font-medium"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

