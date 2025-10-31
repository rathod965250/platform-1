'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Zap, Menu, X, ChevronDown, User, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const [menuState, setMenuState] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [pathname])

  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'Feature', href: '#features', hasDropdown: true },
    { name: 'Pricing', href: '/pricing' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-20 bg-background border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo (left) */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <Zap className="h-5 w-5 md:h-6 md:w-6 text-foreground transition-transform group-hover:scale-110" />
            <span className="text-lg md:text-xl font-bold text-foreground">
              CrackAtom
            </span>
          </Link>

          {/* Desktop menu (center) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <DropdownMenu key={link.name}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors px-0"
                    >
                      {link.name}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/practice" className="flex items-center gap-2">
                        Practice
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/test" className="flex items-center gap-2">
                        Tests
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              )
            )}
          </div>

          {/* Action buttons (right) */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Contact Us Button - Always visible on desktop */}
            {user ? (
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                className="hidden md:flex"
              >
                <Link href="/dashboard">
                  <User className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                asChild
                className="hidden md:inline-flex bg-foreground hover:bg-foreground/90 text-background rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href="/contact">
                  Contact us
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuState(!menuState)}
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5">
                <Menu
                  className={cn(
                    'absolute inset-0 h-5 w-5 transition-all duration-300',
                    menuState ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                  )}
                />
                <X
                  className={cn(
                    'absolute inset-0 h-5 w-5 transition-all duration-300',
                    menuState ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                  )}
                />
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuState && (
        <div className="md:hidden fixed inset-x-0 top-16 mt-4 px-4 z-30">
          <div className="rounded-2xl border border-border shadow-xl bg-background p-6 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Features Dropdown in Mobile */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground px-2">Features</div>
              <Link
                href="/practice"
                onClick={() => setMenuState(false)}
                className="block px-2 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                Practice
              </Link>
              <Link
                href="/test"
                onClick={() => setMenuState(false)}
                className="block px-2 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                Tests
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMenuState(false)}
                className="block px-2 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                Analytics
              </Link>
            </div>

            {/* Other Links */}
            {navLinks.filter((link) => !link.hasDropdown).map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMenuState(false)}
                className="block px-2 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {/* Mobile Auth Buttons */}
            <div className="pt-4 border-t border-border space-y-2">
              {user ? (
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/dashboard" onClick={() => setMenuState(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full" size="sm" asChild>
                    <Link href="/login" onClick={() => setMenuState(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button className="w-full bg-primary hover:bg-primary/90" size="sm" asChild>
                    <Link href="/signup" onClick={() => setMenuState(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
              <Button
                variant="default"
                className="w-full bg-foreground hover:bg-foreground/90 text-background"
                size="sm"
                asChild
              >
                <Link href="/contact" onClick={() => setMenuState(false)}>
                  Contact us
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
