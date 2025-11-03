import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, AlertCircle, ArrowRight } from 'lucide-react'

export default function AuthErrorPage() {
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
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Authentication Error
          </h1>
          <p className="text-muted-foreground mt-2">
            Something went wrong with your authentication
          </p>
        </div>

        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The authentication link may have expired or is invalid. Please try again.
            </p>
            <p className="text-xs text-muted-foreground">
              If the problem persists, contact support or try signing in again.
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/login">
              <Button className="w-full bg-foreground hover:bg-foreground/90 text-background">
                Go to login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full border-border">
                Create new account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

