'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { BookOpen, Clock, Upload, Target, BarChart3, FileText, Brain, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  {
    id: 'self-paced',
    label: 'Self-Paced Practice Mode',
    icon: BookOpen,
    badge: 'SELF-PACED PRACTICE',
    title: 'Intelligent, adaptive learning with instant feedback and personalized recommendations',
    description: 'AI-powered practice mode that adapts to your learning pace and provides personalized question recommendations based on your performance.',
    features: [
      { icon: Brain, text: 'AI-recommended topics based on your performance' },
      { icon: Target, text: 'Adaptive difficulty that evolves with you' },
      { icon: BarChart3, text: 'Track progress with detailed analytics' },
    ],
    cardContent: {
      title: 'Practice Session',
      subtitle: 'Quantitative Aptitude',
      progress: 65,
      questions: '12/20 completed',
      timeSpent: '25 min',
      nextTopic: 'Logical Reasoning',
    },
  },
  {
    id: 'timed-test',
    label: 'Timed Test Mode',
    icon: Clock,
    badge: 'TIMED TEST',
    title: 'Real exam simulation with comprehensive analysis and performance insights',
    description: 'Experience actual placement test conditions with timed tests, company-specific question patterns, and detailed performance analysis.',
    features: [
      { icon: FileText, text: 'Company-specific PYQs from 50+ companies' },
      { icon: Clock, text: 'Real exam interface with timer and sections' },
      { icon: BarChart3, text: 'AI-powered performance analysis dashboard' },
      { icon: Award, text: 'Percentile rankings and cutoff predictions' },
    ],
    cardContent: {
      title: 'Mock Test Active',
      subtitle: 'TCS Placement Test',
      timer: '45:30',
      questions: '30 questions',
      completed: '12/30',
      sections: ['Quant', 'Logical', 'Verbal'],
    },
  },
  {
    id: 'custom-test',
    label: 'Custom Test',
    icon: Upload,
    badge: 'CUSTOM TEST',
    title: 'Convert any PDF, DOC, or image into an interactive test with AI-powered extraction',
    description: 'Upload your study materials and let AI extract questions automatically. Practice with your own documents and create personalized tests.',
    features: [
      { icon: Upload, text: 'Upload PDF, DOC, or image files' },
      { icon: Brain, text: 'AI-powered question extraction' },
      { icon: FileText, text: 'Automatic test generation' },
      { icon: Target, text: 'Practice with extracted questions' },
    ],
    cardContent: {
      title: 'Upload Document',
      subtitle: 'Drag & drop or click to upload',
      format: 'PDF, DOC, DOCX, JPG, PNG',
      maxSize: '10 MB',
      status: 'Ready to upload',
    },
  },
]

export function PerformanceFeaturesSection() {
  const [activeTab, setActiveTab] = useState('self-paced')
  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Built for high performance
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-foreground/70 max-w-3xl mx-auto">
            CrackAtom gives students everything they need to stay aligned, track performance, 
            and scale with confidence — all in one place.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 md:mb-12">
          <div className="inline-flex rounded-full bg-accent/30 p-1 gap-1 md:gap-2 border border-border/50 max-w-full overflow-x-auto sm:overflow-x-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 md:px-6 py-3 md:py-3 rounded-full',
                    'text-sm sm:text-base md:text-lg font-medium transition-all duration-300',
                    'whitespace-nowrap cursor-pointer min-h-[44px]',
                    isActive
                      ? 'bg-card text-foreground shadow-md shadow-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-5xl mx-auto">
          <Card className="rounded-2xl border border-border shadow-xl bg-card/95 backdrop-blur-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left Panel - Placeholder for Interface Images */}
              <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-accent/5 to-accent/10 border-r border-border/50">
                <div className="h-full min-h-[280px] flex items-center justify-center">
                  {/* Blank placeholder - images will be uploaded here */}
                </div>
              </div>

              {/* Right Panel - Description */}
              <div className="p-3 sm:p-4 md:p-5 flex flex-col justify-center">
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 rounded-full text-sm sm:text-base font-semibold bg-chart-1/20 text-chart-1 mb-3">
                    {activeTabData.badge}
                  </span>
                </div>
                
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
                  {activeTabData.title}
                </h3>
                
                <p className="text-sm sm:text-base md:text-lg text-foreground/70 mb-4 leading-relaxed">
                  {activeTabData.description}
                </p>
                
                {/* Features List */}
                <div className="space-y-2">
                  {activeTabData.features.map((feature, index) => {
                    const FeatureIcon = feature.icon
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-accent/20 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-chart-2/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FeatureIcon className="h-3.5 w-3.5 text-chart-2" />
                        </div>
                        <span className="text-sm sm:text-base md:text-lg text-foreground/80 leading-relaxed">
                          {feature.text}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

