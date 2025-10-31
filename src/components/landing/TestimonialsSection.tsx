'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Quote } from 'lucide-react'

const testimonials = [
  {
    quote: 'CrackAtom helped us streamline our preparation and improve scores faster than we imagined. Their mix of AI-powered learning and personalized practice is unmatched.',
    author: 'Talia Smith',
    role: 'Head of Studies at Forma Academy',
    avatar: 'TS',
  },
  {
    quote: 'Working with CrackAtom felt like having a personal tutor. They understood our challenges and delivered real, measurable results in test performance.',
    author: 'Jordan Johnson',
    role: 'Academic Director at Metricon',
    avatar: 'JJ',
  },
  {
    quote: 'From the first practice session, CrackAtom brought clarity and momentum to our test preparation. We\'ve seen a major improvement in student performance.',
    author: 'Samuel Torres',
    role: 'Founder at Bloomtech',
    avatar: 'ST',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-4xl font-bold text-foreground">4.9</div>
            <div className="text-2xl text-yellow-500">/5</div>
            <div className="text-sm text-muted-foreground ml-2">Rated</div>
          </div>
          <div className="text-sm text-muted-foreground mb-8">Over 9.2K Students</div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Success stories
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto">
            CrackAtom has partnered with students to build foundations for sustainable success. 
            Explore real stories of transformation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card"
            >
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/40 mb-4" />
                <p className="text-base text-foreground/80 leading-relaxed mb-6">
                  {testimonial.quote}
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Stories Timeline */}
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            {
              year: '2025',
              company: 'Lumora',
              description: 'Lumora Health partnered with CrackAtom to streamline their test preparation process and improve student scores.',
            },
            {
              year: '2025',
              company: 'NaviAI',
              description: 'NaviAI, an emerging leader in AI-driven education, partnered with CrackAtom to scale their student preparation.',
            },
            {
              year: '2025',
              company: 'Pluto',
              description: 'Helped Pluto scale their test preparation and streamline learning as they expanded into new markets.',
            },
            {
              year: '2024',
              company: 'VitaHealth',
              description: 'Partnered with VitaHealth to set up their first comprehensive test preparation program from the ground up.',
            },
          ].map((story, index) => (
            <div key={index} className="flex gap-6">
              <div className="text-sm font-bold text-primary min-w-[60px]">{story.year}</div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">{story.company}</div>
                <div className="text-sm text-foreground/70">{story.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

