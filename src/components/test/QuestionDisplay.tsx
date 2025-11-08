'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface QuestionDisplayProps {
  question: any
  answer: string | null
  onAnswerChange: (answer: string) => void
}

export function QuestionDisplay({ question, answer, onAnswerChange }: QuestionDisplayProps) {
  const options = question.options as any

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
          {question['question text'] || question.question_text}
        </p>
      </div>

      {/* Answer Options based on question type */}
      {question.question_type === 'mcq' && options?.options && (
        <RadioGroup value={answer || ''} onValueChange={onAnswerChange}>
          <div className="space-y-3">
            {options.options.map((option: string, index: number) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  answer === option
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => onAnswerChange(option)}
              >
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer text-gray-900 dark:text-white"
                >
                  <span className="font-semibold mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )}

      {question.question_type === 'true_false' && (
        <RadioGroup value={answer || ''} onValueChange={onAnswerChange}>
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <div
                key={option}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  answer === option
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => onAnswerChange(option)}
              >
                <RadioGroupItem value={option} id={`option-${option}`} />
                <Label
                  htmlFor={`option-${option}`}
                  className="flex-1 cursor-pointer text-gray-900 dark:text-white"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )}

      {question.question_type === 'fill_blank' && (
        <div className="space-y-2">
          <Label htmlFor="fill-blank-answer">Your Answer</Label>
          <Input
            id="fill-blank-answer"
            type="text"
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="text-lg p-4"
          />
          <p className="text-sm text-gray-500">
            Type your answer in the box above
          </p>
        </div>
      )}
    </div>
  )
}

