import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, Mail, ArrowRight } from 'lucide-react'

export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <Zap className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold text-foreground tracking-tight">
              CrackAtom
            </span>
          </Link>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Check your email
          </h1>
          <p className="text-muted-foreground mt-2">
            We've sent you a confirmation link
          </p>
        </div>

        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please check your email inbox and click the confirmation link to activate your account. 
              The link will redirect you back to your dashboard.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or try signing up again.
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/login">
              <Button variant="outline" className="w-full border-border">
                Back to login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="w-full bg-foreground hover:bg-foreground/90 text-background">
                Sign up again
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

