'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const faqs = [
  {
    id: 'what-is-crackatom',
    question: 'What is CrackAtom and who is it for?',
    answer: 'CrackAtom is an AI-powered aptitude test preparation platform designed for Indian students preparing for placement exams. Whether you\'re targeting IT companies like TCS, Infosys, Wipro, or any other sector, our platform helps you master quantitative aptitude, logical reasoning, verbal ability, data interpretation, and problem-solving skills through adaptive practice and comprehensive mock tests.',
  },
  {
    id: 'test-types',
    question: 'What types of aptitude tests can I practice?',
    answer: 'CrackAtom covers all major aptitude categories: Quantitative Aptitude (Arithmetic, Algebra, Geometry, Percentages, Profit & Loss, Time & Work), Logical Reasoning (Puzzles, Series, Blood Relations, Coding-Decoding), Verbal Ability (Grammar, Vocabulary, Comprehension), Data Interpretation (Tables, Graphs, Charts), and Problem Solving. We also offer company-specific tests tailored for major recruiters.',
  },
  {
    id: 'practice-mode',
    question: 'How does Practice Mode work?',
    answer: 'Practice Mode provides immediate feedback on each question you attempt. You can select specific categories or subcategories, set your preferred difficulty level, and practice with our adaptive algorithm that adjusts question difficulty based on your performance. Each practice session tracks your progress and provides detailed analytics to identify your strengths and weaknesses.',
  },
  {
    id: 'mock-tests',
    question: 'What are Mock Tests and how do they simulate real exams?',
    answer: 'Our Mock Tests provide a complete exam-like experience with a full-screen interface, real-time timer, question navigation palette, and auto-submit functionality. Tests include company-specific questions, timed sessions, negative marking (where applicable), and comprehensive results with performance analysis, section-wise breakdowns, and AI-powered recommendations.',
  },
  {
    id: 'ai-analytics',
    question: 'How does the AI-powered analytics help me improve?',
    answer: 'Our AI analytics engine analyzes your performance patterns across all test attempts and practice sessions. It identifies your weak areas, tracks improvement trends, provides personalized recommendations for topic focus, suggests optimal study paths, and generates insights on time management and accuracy improvements. You\'ll get detailed reports with visual charts and actionable feedback.',
  },
  {
    id: 'adaptive-learning',
    question: 'What is adaptive learning and how does it work?',
    answer: 'Our adaptive learning algorithm adjusts question difficulty in real-time based on your performance. If you\'re answering questions correctly, the system gradually increases difficulty to challenge you. If you\'re struggling, it provides easier questions to build confidence. This personalized approach ensures you\'re always learning at the optimal level and making steady progress.',
  },
  {
    id: 'leaderboard',
    question: 'How does the Leaderboard system work?',
    answer: 'We maintain comprehensive leaderboards including Global (All-Time), Weekly, Monthly, and Test-Specific rankings. The leaderboard tracks top performers, shows your current rank, highlights top 3 positions with special badges, and allows you to compete with peers while staying motivated throughout your preparation journey.',
  },
  {
    id: 'results-analysis',
    question: 'What kind of results and analysis will I get after a test?',
    answer: 'After each test attempt, you receive a comprehensive results page with: Overview (score, percentage, percentile, section-wise performance), Detailed Analysis (topic-wise accuracy, time distribution charts, difficulty breakdown), Solutions (complete question review with explanations, your answers vs correct answers, filter by incorrect/marked/skipped questions), and Downloadable Reports (PDF format with full analysis).',
  },
  {
    id: 'company-specific',
    question: 'Do you have company-specific test questions?',
    answer: 'Yes! CrackAtom offers company-specific test banks for major recruiters including TCS, Infosys, Wipro, Microsoft, Amazon, Google, and many others. Our tests contain questions similar to those asked in actual company placement exams, helping you prepare specifically for your target companies with realistic test patterns and question types. Note: We provide similar-type questions and test formats, but not exact same questions or previous year questions (PYQs) to ensure genuine learning and fair practice.',
  },
  {
    id: 'improvement-timeline',
    question: 'How long does it take to see improvement in my scores?',
    answer: 'Most students begin noticing improvements in their practice scores within the first few weeks of consistent practice. Significant score improvements typically occur within 4-6 weeks of regular practice sessions. For comprehensive mastery and deeper understanding across all categories, we typically see substantial improvements within 2-3 months of dedicated preparation using our adaptive learning system.',
  },
  {
    id: 'pricing-plans',
    question: 'Is CrackAtom free to use?',
    answer: 'CrackAtom is currently **FREE** to use! This includes unlimited practice sessions, access to mock tests, detailed analytics, AI-powered recommendations, company-specific tests, comprehensive results analysis, and leaderboard participation. However, we plan to introduce paid premium features in the future for advanced analytics, detailed performance reports, priority support, and exclusive content. **Join now while it\'s free** and lock in your access before we transition to a paid model. Don\'t miss out - start your preparation journey today!',
  },
]

// Team avatars for CTA section
const teamAvatars = [
  {
    src: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    alt: 'Sarah Chen',
    name: 'SC',
  },
  {
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    alt: 'Mike Johnson',
    name: 'MJ',
  },
  {
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
    alt: 'Emily Davis',
    name: 'ED',
  },
]

export function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about the product and billing.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="multiple" className="w-full space-y-0">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-b border-border px-0 py-0"
              >
                <AccordionTrigger className="text-base sm:text-lg font-semibold text-foreground hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="mt-16 md:mt-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-muted/50 rounded-2xl p-6 md:p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                {/* Team Avatars */}
                <div className="flex -space-x-3">
                  {teamAvatars.map((avatar, index) => (
                    <div
                      key={index}
                      className="h-10 w-10 rounded-full overflow-hidden border-2 border-background ring-2 ring-muted"
                    >
                      <Image
                        src={avatar.src}
                        alt={avatar.alt}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Can't find the answer you're looking for? Please chat to our friendly team.
              </p>

              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 py-3"
              >
                <Link href="/contact">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Get in touch
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
