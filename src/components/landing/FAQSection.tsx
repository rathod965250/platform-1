'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'What types of tests do you prepare students for?',
    answer: 'We partner with students preparing for aptitude tests, placement exams, and competitive exams across various industries. Whether you\'re targeting IT companies, finance, or other sectors, our adaptive learning adapts to your needs.',
  },
  {
    question: 'How long does it take to see results?',
    answer: 'Most students begin noticing improvements in their practice scores within the first few weeks. For comprehensive preparation and deeper understanding, we typically see lasting impact within 2 to 3 months of consistent practice.',
  },
  {
    question: 'Can CrackAtom integrate with our existing learning tools?',
    answer: 'Yes. CrackAtom is built to work alongside a wide range of platforms and study tools. You can export your progress, share results, and integrate with your existing learning management systems.',
  },
  {
    question: 'Do you offer one-time practice sessions or ongoing support?',
    answer: 'Both. You can engage us for one-time mock tests and practice sessions, or opt for ongoing adaptive practice and performance tracking depending on your goals and preparation timeline.',
  },
  {
    question: 'What does onboarding look like?',
    answer: 'Our onboarding process is simple and collaborative. We start with an assessment to understand your current level, align on goals, and provide a tailored preparation roadmap to guide your learning journey.',
  },
]

export function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-accent/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your questions, answered
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto">
            Get quick answers to the most common questions about our platform and services.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-2 border-border rounded-lg px-4 py-2 bg-card"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <a
            href="/contact"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Contact us
          </a>
        </div>
      </div>
    </section>
  )
}

