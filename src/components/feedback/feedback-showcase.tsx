'use client';

import { Palette,RotateCcw, Settings } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { 
  FeedbackTrigger, 
  FeedbackWidget, 
  InlineFeedbackButton, 
  MinimalFeedbackTrigger,
  type ThemeOption,
  useFeedbackWidget,
  type WidgetPosition} from './index';

/**
 * FeedbackShowcase Component
 * 
 * A comprehensive showcase and testing component for all feedback widgets.
 * This component allows developers and users to:
 * - Test all widget variants and configurations
 * - Verify Formbricks integration
 * - Test responsive behavior
 * - Validate accessibility features
 * - Preview different themes and positions
 */
export function FeedbackShowcase() {
  // State for widget configuration
  const [position, setPosition] = useState<WidgetPosition>('bottom-right');
  const [theme, setTheme] = useState<ThemeOption>('auto');
  const [showBadge, setShowBadge] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [showInline, setShowInline] = useState(true);

  // Hook for controlling widget
  const { showWidget, hideWidget } = useFeedbackWidget();

  return (
    <div className="min-h-screen bg-background p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Feedback Widget Showcase</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Test and preview all feedback widget components with different configurations.
          This showcase demonstrates the integration with Formbricks SDK and various UI states.
        </p>
        <Badge variant="outline" className="mt-2">
          FB-005 Implementation
        </Badge>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Widget Configuration
            </CardTitle>
            <CardDescription>
              Customize the feedback widget appearance and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Position Selection */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select value={position} onValueChange={(value) => setPosition(value as WidgetPosition)}>
                <SelectTrigger id="position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme Selection */}
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as ThemeOption)}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="widget-enabled">Widget Enabled</Label>
                <Switch 
                  id="widget-enabled"
                  checked={widgetEnabled} 
                  onCheckedChange={setWidgetEnabled} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-badge">Show Badge</Label>
                <Switch 
                  id="show-badge"
                  checked={showBadge} 
                  onCheckedChange={setShowBadge} 
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-inline">Show Inline Examples</Label>
                <Switch 
                  id="show-inline"
                  checked={showInline} 
                  onCheckedChange={setShowInline} 
                />
              </div>
            </div>

            <Separator />

            {/* Control Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Widget Controls</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={showWidget}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={hideWidget}
                  className="text-xs"
                >
                  Hide Widget
                </Button>
              </div>
            </div>

            {/* Integration Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Integration Status</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>✅ Formbricks SDK Integration</div>
                <div>✅ Event Tracking</div>
                <div>✅ User Attributes</div>
                <div>✅ Survey Modal</div>
                <div>✅ Responsive Design</div>
                <div>✅ Accessibility (WCAG 2.1)</div>
                <div>✅ Theme Support</div>
                <div>✅ localStorage Persistence</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Component Examples
            </CardTitle>
            <CardDescription>
              Preview different feedback trigger components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Standard Trigger Examples */}
            {showInline && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Standard Triggers</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">Default Button</div>
                      <FeedbackTrigger />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">With Badge</div>
                      <FeedbackTrigger 
                        showBadge={true} 
                        badgeContent="New" 
                      />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">Small Size</div>
                      <FeedbackTrigger 
                        size="sm" 
                        text="Help" 
                      />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">Large Size</div>
                      <FeedbackTrigger 
                        size="lg" 
                        text="Share Feedback" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Variant Examples */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Variants</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">Inline Button</div>
                      <InlineFeedbackButton />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">Minimal Trigger</div>
                      <MinimalFeedbackTrigger />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">FAB (Static)</div>
                      <div className="relative h-16 overflow-hidden bg-muted/20 rounded">
                        <div className="absolute bottom-2 right-2">
                          <FeedbackTrigger variant="fab" className="relative" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Integration Examples */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Integration Examples</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-2">Navigation Menu Integration</div>
                      <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
                        <span className="text-sm">Dashboard</span>
                        <span className="text-sm">Settings</span>
                        <span className="text-sm">Profile</span>
                        <MinimalFeedbackTrigger />
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-2">Sidebar Integration</div>
                      <div className="flex gap-2">
                        <div className="w-48 p-3 bg-muted/20 rounded space-y-2">
                          <div className="text-xs">Menu Item 1</div>
                          <div className="text-xs">Menu Item 2</div>
                          <div className="text-xs">Menu Item 3</div>
                          <Separator />
                          <InlineFeedbackButton size="sm" text="Feedback" />
                        </div>
                        <div className="flex-1 p-3 bg-muted/10 rounded flex items-center justify-center text-xs text-muted-foreground">
                          Main Content Area
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Widget Preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Live Floating Widget</h4>
              <div className="p-4 border-2 border-dashed rounded-lg bg-muted/20 text-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  The floating feedback widget is positioned at: <Badge variant="secondary">{position}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Check the {position.replace('-', ' ')} corner of your screen
                </div>
                {!widgetEnabled && (
                  <div className="text-xs text-orange-600">
                    ⚠️ Widget is currently disabled
                  </div>
                )}
              </div>
            </div>

            {/* Testing Instructions */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Testing Checklist</h4>
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 p-3 rounded">
                <div>□ Test widget positioning on different screen sizes</div>
                <div>□ Verify theme switching (light/dark/auto)</div>
                <div>□ Test survey modal flow and responses</div>
                <div>□ Check localStorage persistence after refresh</div>
                <div>□ Verify accessibility with screen readers</div>
                <div>□ Test keyboard navigation (Tab, Enter, Escape)</div>
                <div>□ Confirm Formbricks event tracking in console</div>
                <div>□ Test widget dismissal and restoration</div>
                <div>□ Verify mobile responsive behavior</div>
                <div>□ Check touch interactions on mobile devices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Floating Feedback Widget */}
      {widgetEnabled && (
        <FeedbackWidget
          position={position}
          theme={theme}
          showBadge={showBadge}
          badgeContent={showBadge ? "1" : undefined}
          className="animate-in slide-in-from-bottom-2 duration-500"
        />
      )}
    </div>
  );
}

export default FeedbackShowcase;