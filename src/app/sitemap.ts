import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/practice`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/test`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ]

  try {
    const supabase = await createClient()

    // Fetch published tests
    const { data: tests } = await supabase
      .from('tests')
      .select('id, slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(100)

    // Fetch categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug')
      .order('order', { ascending: true })

    // Build dynamic routes
    const dynamicRoutes: MetadataRoute.Sitemap = []

    // Test routes
    tests?.forEach((test) => {
      dynamicRoutes.push({
        url: `${baseUrl}/test/${test.id}`,
        lastModified: test.updated_at ? new Date(test.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })

    // Category routes
    categories?.forEach((category) => {
      dynamicRoutes.push({
        url: `${baseUrl}/practice/configure/${category.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    })

    return [...staticRoutes, ...dynamicRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static routes if dynamic generation fails
    return staticRoutes
  }
}

