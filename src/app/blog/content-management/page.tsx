/**
 * Content Management Demo Page
 * Showcases enhanced content organization features
 */

import { Metadata } from 'next';
import React from 'react';

import { 
  getAllCategories, 
  getAllTags, 
  getContentAnalytics 
} from '@/lib/blog/content';

import { ContentAnalyticsComponent } from '../components/content-analytics';

export const metadata: Metadata = {
  title: 'Content Management - LawnQuote Blog',
  description: 'Content analytics and management dashboard for the LawnQuote blog',
};

export default async function ContentManagementPage() {
  const [categories, tags, analytics] = await Promise.all([
    getAllCategories(),
    getAllTags(),
    getContentAnalytics()
  ]);

  return (
    <div className="min-h-screen bg-light-concrete">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-black text-forest-green mb-4">
            Content Management Dashboard
          </h1>
          <p className="text-lg text-charcoal">
            Analytics and insights for blog content organization and performance.
          </p>
        </div>

        {/* Analytics */}
        <ContentAnalyticsComponent analytics={analytics} className="mb-8" />

        {/* Available Filters Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg p-8">
            <h3 className="text-xl md:text-2xl font-bold text-forest-green mb-4">
              Available Categories ({categories.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span 
                  key={category}
                  className="px-3 py-1.5 bg-forest-green/10 text-forest-green rounded-full text-sm font-medium"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg p-8">
            <h3 className="text-xl md:text-2xl font-bold text-forest-green mb-4">
              Available Tags ({tags.length})
            </h3>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {tags.map((tag) => (
                <span 
                  key={tag}
                  className="px-2 py-1 bg-stone-gray/10 text-charcoal border border-stone-gray/20 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg p-8">
          <h3 className="text-xl md:text-2xl font-bold text-forest-green mb-6">
            Enhanced Content Organization Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-charcoal">Advanced Search</h4>
              <ul className="text-lg text-charcoal space-y-2">
                <li>• Full-text search across titles and content</li>
                <li>• Tag-based search</li>
                <li>• Debounced search input</li>
                <li>• Search result highlighting</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-charcoal">Smart Filtering</h4>
              <ul className="text-lg text-charcoal space-y-2">
                <li>• Category-based filtering</li>
                <li>• Multi-tag selection</li>
                <li>• Featured posts filter</li>
                <li>• Combined filter logic</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-charcoal">Related Content</h4>
              <ul className="text-lg text-charcoal space-y-2">
                <li>• Category-based recommendations</li>
                <li>• Tag similarity scoring</li>
                <li>• Featured post prioritization</li>
                <li>• Relevance-based sorting</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-charcoal">Content Analytics</h4>
              <ul className="text-lg text-charcoal space-y-2">
                <li>• Category distribution analysis</li>
                <li>• Tag usage statistics</li>
                <li>• Reading time insights</li>
                <li>• Featured content ratio</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-charcoal">User Experience</h4>
              <ul className="text-lg text-charcoal space-y-2">
                <li>• Responsive filter interface</li>
                <li>• Active filter indicators</li>
                <li>• One-click filter clearing</li>
                <li>• Keyboard accessibility</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-charcoal">Performance</h4>
              <ul className="text-lg text-charcoal space-y-2">
                <li>• Efficient content indexing</li>
                <li>• Optimized search algorithms</li>
                <li>• Cached analytics data</li>
                <li>• Minimal re-renders</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-equipment-yellow/10 border border-equipment-yellow/20 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-charcoal mb-4">
            Implementation Notes
          </h3>
          <div className="text-lg text-charcoal space-y-3">
            <p>
              <strong>Story 2.2 Status:</strong> Enhanced content organization features have been implemented with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Tag support in frontmatter schema ✅</li>
              <li>Advanced search and filtering functions ✅</li>
              <li>Improved related posts algorithm with tag similarity ✅</li>
              <li>Content analytics and insights ✅</li>
              <li>Responsive filter UI components ✅</li>
            </ul>
            <p className="mt-4">
              <strong>Next:</strong> These components can be integrated into the main blog pages to provide enhanced user experience and content discoverability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
