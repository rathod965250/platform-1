'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon'
import { createPortal } from 'react-dom'
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { LucideIcon } from 'lucide-react'
import {
	BookOpen,
	Clock,
	BarChart3,
	Trophy,
	Users,
	Star,
	HelpCircle,
	FileText,
	Shield,
	RotateCcw,
	Leaf,
	Brain,
	TrendingUp,
	Zap,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type LinkItem = {
	title: string
	href: string
	icon: LucideIcon
	description?: string
}

function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false)

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold)
	}, [threshold])

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll)
		return () => window.removeEventListener('scroll', onScroll)
	}, [onScroll])

	React.useEffect(() => {
		onScroll()
	}, [onScroll])

	return scrolled
}

export function Header() {
	const [open, setOpen] = useState(false)
	const scrolled = useScroll(10)
	const [user, setUser] = useState<any>(null)

	useEffect(() => {
		const checkUser = async () => {
			const supabase = createClient()
			const { data: { user } } = await supabase.auth.getUser()
			setUser(user)
		}
		checkUser()
	}, [])

	useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [open])

	return (
		<header
			className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
				'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg':
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-14 sm:h-16 md:h-12 lg:h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6 md:px-8">
				<div className="flex items-center gap-3 sm:gap-4 md:gap-5">
					<Link href="/" className="hover:bg-accent rounded-md p-1.5 sm:p-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
						<div className="flex items-center gap-1.5 sm:gap-2">
							<Zap className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary shrink-0" />
							<span className="text-base sm:text-lg md:text-xl font-bold text-foreground">CrackAtom</span>
						</div>
					</Link>
					<NavigationMenu className="hidden md:flex">
						<NavigationMenuList>
							<NavigationMenuItem>
								<NavigationMenuTrigger className="bg-transparent text-foreground text-sm sm:text-base md:text-base font-medium min-h-[44px] px-3 sm:px-4">Product</NavigationMenuTrigger>
								<NavigationMenuContent className="bg-background p-1 pr-1.5">
									<ul className="bg-popover grid w-lg grid-cols-2 gap-2 rounded-md border p-2 shadow">
										{productLinks.map((item, i) => (
											<li key={i}>
												<ListItem {...item} />
											</li>
										))}
									</ul>
									<div className="p-2 sm:p-2.5 md:p-3">
										<p className="text-muted-foreground text-xs sm:text-sm md:text-sm">
											Ready to improve?{' '}
											<Link href="/signup" className="text-primary font-medium hover:underline min-h-[44px] inline-flex items-center px-2">
												Start practicing free
											</Link>
										</p>
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>
							<NavigationMenuItem>
								<NavigationMenuTrigger className="bg-transparent text-foreground text-sm sm:text-base md:text-base font-medium min-h-[44px] px-3 sm:px-4">Company</NavigationMenuTrigger>
								<NavigationMenuContent className="bg-background p-1 pr-1.5 pb-1.5">
									<div className="grid w-lg grid-cols-2 gap-2">
										<ul className="bg-popover space-y-2 rounded-md border p-2 shadow">
											{companyLinks.map((item, i) => (
												<li key={i}>
													<ListItem {...item} />
												</li>
											))}
										</ul>
										<ul className="space-y-2 p-3">
											{companyLinks2.map((item, i) => (
												<li key={i}>
													<NavigationMenuLink
														href={item.href}
														className="flex p-2 sm:p-2.5 md:p-3 hover:bg-accent flex-row rounded-md items-center gap-x-2 sm:gap-x-2.5 transition-colors min-h-[44px]"
													>
														<item.icon className="text-foreground size-4 sm:size-4 md:size-5 shrink-0" />
														<span className="font-medium text-foreground text-sm sm:text-base md:text-base">{item.title}</span>
													</NavigationMenuLink>
												</li>
											))}
										</ul>
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>
							<NavigationMenuLink className="px-3 sm:px-4" asChild>
								<Link href="/pricing" className="hover:bg-accent rounded-md p-2 sm:p-2.5 transition-colors text-foreground text-sm sm:text-base md:text-base font-medium min-h-[44px] flex items-center">
									Pricing
								</Link>
							</NavigationMenuLink>
						</NavigationMenuList>
					</NavigationMenu>
				</div>
				<div className="hidden items-center gap-2 sm:gap-3 md:flex">
					{user ? (
						<Link href="/dashboard">
							<Button variant="outline" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[44px] md:h-10 px-4 sm:px-5 md:px-6">Dashboard</Button>
						</Link>
					) : (
						<>
							<Link href="/login">
								<Button variant="outline" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[44px] md:h-10 px-4 sm:px-5 md:px-6">Sign In</Button>
							</Link>
							<Link href="/signup">
								<Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-10 px-4 sm:px-5 md:px-6">Get Started</Button>
							</Link>
						</>
					)}
				</div>
				<Button
					size="icon"
					variant="outline"
					onClick={() => setOpen(!open)}
					className="md:hidden min-h-[44px] min-w-[44px]"
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label="Toggle menu"
				>
					<MenuToggleIcon open={open} className="size-5 sm:size-6" duration={300} />
				</Button>
			</nav>
			<MobileMenu open={open} className="flex flex-col justify-between gap-3 sm:gap-4 overflow-y-auto">
				<NavigationMenu className="max-w-full">
					<div className="flex w-full flex-col gap-y-2 sm:gap-y-2.5">
						<span className="text-sm sm:text-base md:text-base font-semibold text-foreground mb-1 sm:mb-2">Product</span>
						{productLinks.map((link) => (
							<ListItem key={link.title} {...link} />
						))}
						<span className="text-sm sm:text-base md:text-base font-semibold text-foreground mt-4 sm:mt-5 mb-1 sm:mb-2">Company</span>
						{companyLinks.map((link) => (
							<ListItem key={link.title} {...link} />
						))}
						{companyLinks2.map((link) => (
							<ListItem key={link.title} {...link} />
						))}
						<Link href="/pricing" onClick={() => setOpen(false)}>
							<Button variant="ghost" className="w-full justify-start text-sm sm:text-base md:text-base font-medium min-h-[44px] px-3 sm:px-4">
								Pricing
							</Button>
						</Link>
					</div>
				</NavigationMenu>
				<div className="flex flex-col gap-2 sm:gap-2.5">
					{user ? (
						<Link href="/dashboard" onClick={() => setOpen(false)}>
							<Button variant="outline" className="w-full text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] md:h-12">
								Dashboard
							</Button>
						</Link>
					) : (
						<>
							<Link href="/login" onClick={() => setOpen(false)}>
								<Button variant="outline" className="w-full text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] md:h-12">
									Sign In
								</Button>
							</Link>
							<Link href="/signup" onClick={() => setOpen(false)}>
								<Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12">Get Started</Button>
							</Link>
						</>
					)}
				</div>
			</MobileMenu>
		</header>
	)
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean
}

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg',
				'fixed top-14 sm:top-16 md:top-12 lg:top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden',
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
					'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
					'size-full p-4 sm:p-5 md:p-6',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	)
}

function ListItem({
	title,
	description,
	icon: Icon,
	className,
	href,
	...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
	return (
		<NavigationMenuLink
			className={cn(
				'w-full flex flex-row gap-x-2 sm:gap-x-2.5 md:gap-x-3 data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-sm p-2 sm:p-2.5 md:p-3 transition-colors min-h-[44px]',
				className
			)}
			{...props}
			asChild
		>
			<Link href={href}>
				<div className="bg-chart-1/20 flex aspect-square size-10 sm:size-12 md:size-12 items-center justify-center rounded-md border shadow-sm shrink-0">
					<Icon className="text-chart-1 size-4 sm:size-5 md:size-5" />
				</div>
				<div className="flex flex-col items-start justify-center min-w-0 flex-1">
					<span className="font-medium text-foreground text-sm sm:text-base md:text-base">{title}</span>
					{description && <span className="text-muted-foreground text-xs sm:text-sm md:text-sm leading-relaxed">{description}</span>}
				</div>
			</Link>
		</NavigationMenuLink>
	)
}

const productLinks: LinkItem[] = [
	{
		title: 'Self-Paced Practice',
		href: '/practice',
		description: 'AI-powered adaptive learning with instant feedback',
		icon: BookOpen,
	},
	{
		title: 'Timed Test Mode',
		href: '/test',
		description: 'Real exam simulation with comprehensive analysis',
		icon: Clock,
	},
	{
		title: 'Analytics & Insights',
		href: '/analytics',
		description: 'Track performance and get AI-powered recommendations',
		icon: BarChart3,
	},
	{
		title: 'Leaderboard',
		href: '/leaderboard',
		description: 'Compete with peers and track your ranking',
		icon: Trophy,
	},
	{
		title: 'Adaptive Learning',
		href: '/practice',
		description: 'AI adjusts difficulty based on your performance',
		icon: Brain,
	},
	{
		title: 'Performance Tracking',
		href: '/results',
		description: 'Detailed insights on strengths and weaknesses',
		icon: TrendingUp,
	},
]

const companyLinks: LinkItem[] = [
	{
		title: 'About Us',
		href: '/about',
		description: 'Learn more about CrackAtom and our mission',
		icon: Users,
	},
	{
		title: 'Success Stories',
		href: '/testimonials',
		description: 'See how students achieved their placement goals',
		icon: Star,
	},
	{
		title: 'Help Center',
		href: '/help',
		description: 'Get support and answers to your questions',
		icon: HelpCircle,
	},
]

const companyLinks2: LinkItem[] = [
	{
		title: 'Terms of Service',
		href: '/terms',
		icon: FileText,
	},
	{
		title: 'Privacy Policy',
		href: '/privacy',
		icon: Shield,
	},
	{
		title: 'Refund Policy',
		href: '/refund',
		icon: RotateCcw,
	},
	{
		title: 'Blog',
		href: '/blog',
		icon: Leaf,
	},
]
