/**
 * Content Analytics Component
 * Displays insights about blog content performance and distribution
 */

'use client';

import { BarChart3Icon, ClockIcon, StarIcon, TagIcon, TrendingUpIcon } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

interface ContentAnalytics {
  totalPosts: number;
  categories: Array<{ category: string; count: number }>;
  tags: Array<{ tag: string; count: number }>;
  avgReadingTime: number;
  featuredRatio: number;
  recentPosts: Array<{ title: string; publishedAt: string; readTime: number }>;
}

interface ContentAnalyticsProps {
  analytics: ContentAnalytics;
  className?: string;
}

export function ContentAnalyticsComponent({ analytics, className }: ContentAnalyticsProps) {
  const maxCategoryCount = Math.max(...analytics.categories.map(c => c.count));
  const maxTagCount = Math.max(...analytics.tags.slice(0, 10).map(t => t.count));

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {/* Overview Stats */}
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-charcoal">Total Posts</CardTitle>
          <BarChart3Icon className="h-4 w-4 text-charcoal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-forest-green">{analytics.totalPosts}</div>
          <p className="text-sm text-charcoal">
            Published blog posts
          </p>
        </CardContent>
      </Card>

      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-charcoal">Avg Reading Time</CardTitle>
          <ClockIcon className="h-4 w-4 text-charcoal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-forest-green">{analytics.avgReadingTime} min</div>
          <p className="text-sm text-charcoal">
            Average time to read
          </p>
        </CardContent>
      </Card>

      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-charcoal">Featured Posts</CardTitle>
          <StarIcon className="h-4 w-4 text-charcoal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-forest-green">{analytics.featuredRatio}%</div>
          <p className="text-sm text-charcoal">
            Of posts are featured
          </p>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="md:col-span-2 bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-forest-green">
            <TrendingUpIcon className="h-5 w-5" />
            Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.categories.map((category) => (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-charcoal capitalize">
                  {category.category}
                </span>
                <span className="text-lg text-charcoal">
                  {category.count} posts
                </span>
              </div>
              <Progress 
                value={(category.count / maxCategoryCount) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Tags */}
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-forest-green">
            <TagIcon className="h-5 w-5" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.tags.slice(0, 8).map((tag) => (
            <div key={tag.tag} className="flex items-center justify-between">
              <span className="text-lg text-charcoal">{tag.tag}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-stone-gray/20 rounded-full h-2">
                  <div 
                    className="bg-forest-green h-2 rounded-full transition-all"
                    style={{ width: `${(tag.count / maxTagCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-charcoal w-6 text-right font-mono">
                  {tag.count}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card className="md:col-span-2 lg:col-span-3 bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-forest-green">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentPosts.map((post, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-light-concrete rounded-lg">
                <div className="flex-1">
                  <h4 className="font-bold text-charcoal text-lg">{post.title}</h4>
                  <p className="text-lg text-charcoal">
                    Published {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-lg text-charcoal">
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-mono">{post.readTime} min</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
