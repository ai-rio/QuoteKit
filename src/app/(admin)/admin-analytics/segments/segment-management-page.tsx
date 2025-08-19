'use client';

import { 
  ArrowLeft,
  Calendar,
  Copy,
  Edit,
  Eye,
  Filter, 
  MoreHorizontal,
  Plus, 
  Search, 
  Settings, 
  Target, 
  Trash2,
  TrendingUp,
  Users} from 'lucide-react';
import Link from 'next/link';
import { useEffect,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { adminSegmentationService, AdminUserSegment } from '@/libs/formbricks/admin-segmentation-service';
// Import services
import { formbricksAnalyticsService } from '@/libs/formbricks/analytics-service';

// Use AdminUserSegment from the service
interface SegmentCriteria {
  field: string;
  operator: string;
  value: string;
  type: 'user_property' | 'behavior' | 'plan' | 'engagement';
}

export function SegmentManagementPage() {
  const [segments, setSegments] = useState<AdminUserSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('segments');

  // Load segments from real data with enhanced error handling
  useEffect(() => {
    const loadSegments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Test connection first
        const connectionTest = await formbricksAnalyticsService.testConnection();
        if (!connectionTest.success) {
          console.warn('Formbricks API not available:', connectionTest.message);
          // Use mock data instead of failing completely
          const mockSegments = await adminSegmentationService.generateMockSegments();
          setSegments(mockSegments);
          setLoading(false);
          return;
        }

        const [surveysData, responsesData] = await Promise.all([
          formbricksAnalyticsService.fetchSurveys().catch(err => {
            console.warn('Failed to fetch surveys, using empty array:', err);
            return [];
          }),
          formbricksAnalyticsService.fetchSurveyResponses({ limit: 10000 }).catch(err => {
            console.warn('Failed to fetch responses, using empty result:', err);
            return { responses: [], total: 0, hasMore: false };
          })
        ]);

        const generatedSegments = await adminSegmentationService.generateSegmentsFromData(
          responsesData.responses, 
          surveysData
        );

        setSegments(generatedSegments);
      } catch (err) {
        console.warn('Error loading segments, using fallback data:', err);
        
        // Generate fallback segments instead of failing
        try {
          const fallbackSegments = await adminSegmentationService.generateMockSegments();
          setSegments(fallbackSegments);
          setError(null); // Clear error since we have fallback data
        } catch (fallbackErr) {
          console.error('Failed to generate fallback segments:', fallbackErr);
          setError('Unable to load segment data. Please refresh the page to try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSegments();
  }, []);

  const filteredSegments = segments.filter(segment => {
    const matchesSearch = segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         segment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || segment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-light-concrete">
        <div className="bg-paper-white border-b border-stone-gray/20">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-4xl md:text-6xl font-black text-forest-green">
              User Segments
            </h1>
            <p className="text-lg text-charcoal mt-2">
              Loading segment data...
            </p>
          </div>
        </div>
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-5 bg-stone-gray/20 rounded w-3/4"></div>
                      <div className="h-4 bg-stone-gray/20 rounded w-full"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="h-3 bg-stone-gray/20 rounded w-1/2"></div>
                        <div className="h-6 bg-stone-gray/20 rounded w-2/3"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-stone-gray/20 rounded w-1/2"></div>
                        <div className="h-6 bg-stone-gray/20 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-light-concrete">
        <div className="bg-paper-white border-b border-stone-gray/20">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-4xl md:text-6xl font-black text-forest-green">
              User Segments
            </h1>
            <p className="text-lg text-charcoal mt-2">
              Error loading segment data
            </p>
          </div>
        </div>
        <div className="container mx-auto px-6 py-8">
          <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-charcoal mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-concrete">
      {/* Header */}
      <div className="bg-paper-white border-b border-stone-gray/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/admin/analytics"
              className="text-charcoal hover:text-forest-green transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-forest-green">
                User Segments
              </h1>
              <p className="text-lg text-charcoal mt-2">
                Create, manage, and analyze user segments for targeted campaigns and personalized experiences
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                <Input
                  placeholder="Search segments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-lg"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Segment
                </Button>
              </DialogTrigger>
              <CreateSegmentDialog onClose={() => setIsCreateDialogOpen(false)} />
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="segments">Segments ({segments.length})</TabsTrigger>
            <TabsTrigger value="analytics">Performance</TabsTrigger>
            <TabsTrigger value="targeting">Targeting Rules</TabsTrigger>
          </TabsList>

          {/* Segments List Tab */}
          <TabsContent value="segments">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSegments.map((segment) => (
                <SegmentCard key={segment.id} segment={segment} />
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <SegmentAnalytics segments={segments} />
          </TabsContent>

          {/* Targeting Rules Tab */}
          <TabsContent value="targeting">
            <TargetingRulesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Segment Card Component
function SegmentCard({ segment }: { segment: AdminUserSegment }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-forest-green text-paper-white';
      case 'draft': return 'bg-equipment-yellow text-charcoal';
      case 'archived': return 'bg-stone-gray text-paper-white';
      default: return 'bg-stone-gray text-paper-white';
    }
  };

  return (
    <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="p-6">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-xl font-bold text-forest-green flex-1">
            {segment.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(segment.status)}>
              {segment.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Segment
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="text-lg text-charcoal">
          {segment.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-charcoal text-base">Users</p>
              <p className="font-mono font-medium text-forest-green text-xl">
                {segment.userCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-bold text-charcoal text-base">Engagement</p>
              <p className="font-mono font-medium text-forest-green text-xl">
                {segment.engagementScore}%
              </p>
            </div>
          </div>

          {segment.conversionRate && (
            <div>
              <p className="font-bold text-charcoal text-base">Conversion Rate</p>
              <p className="font-mono font-medium text-forest-green text-lg">
                {segment.conversionRate}%
              </p>
            </div>
          )}

          {/* Criteria Preview */}
          <div>
            <p className="font-bold text-charcoal text-base mb-2">Key Criteria</p>
            <div className="space-y-1">
              {segment.criteria.slice(0, 2).map((criterion, index) => (
                <Badge key={index} variant="outline" className="mr-2 mb-1">
                  {criterion.field}: {criterion.operator} {criterion.value}
                </Badge>
              ))}
              {segment.criteria.length > 2 && (
                <Badge variant="outline" className="mr-2 mb-1">
                  +{segment.criteria.length - 2} more
                </Badge>
              )}
            </div>
          </div>

          {/* Last Updated */}
          <div className="pt-4 border-t border-stone-gray/20">
            <p className="text-charcoal text-base">
              <span className="font-bold">Last updated: </span>
              {new Date(segment.lastUpdated).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 py-2 rounded-lg transition-all duration-200 flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm"
                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-4 py-2 rounded-lg transition-all duration-200 flex-1"
              >
                <Target className="w-4 h-4 mr-1" />
                Target
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Segment Dialog Component
function CreateSegmentDialog({ onClose }: { onClose: () => void }) {
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [criteria, setCriteria] = useState<SegmentCriteria[]>([]);

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl md:text-2xl font-bold text-forest-green">
          Create New Segment
        </DialogTitle>
        <DialogDescription className="text-lg text-charcoal">
          Define targeting criteria to create a custom user segment
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="segment-name" className="text-lg font-bold text-charcoal">
            Segment Name
          </Label>
          <Input
            id="segment-name"
            placeholder="e.g. High-Value Users"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            className="text-lg"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="segment-description" className="text-lg font-bold text-charcoal">
            Description
          </Label>
          <Textarea
            id="segment-description"
            placeholder="Describe this segment and its intended use..."
            value={segmentDescription}
            onChange={(e) => setSegmentDescription(e.target.value)}
            rows={3}
            className="text-lg"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-bold text-charcoal">
            Targeting Criteria
          </Label>
          <div className="border border-stone-gray/20 rounded-lg p-4 bg-light-concrete/50">
            <p className="text-charcoal text-base mb-4">
              Add criteria to define who should be included in this segment
            </p>
            <Button 
              variant="outline"
              className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 py-2 rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Criteria
            </Button>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={onClose}
          className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
        >
          Cancel
        </Button>
        <Button 
          className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
          disabled={!segmentName.trim()}
        >
          Create Segment
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// Segment Analytics Component
function SegmentAnalytics({ segments }: { segments: AdminUserSegment[] }) {
  const totalUsers = segments.reduce((sum, segment) => sum + segment.userCount, 0);
  const avgEngagement = segments.reduce((sum, segment) => sum + (segment.engagementScore || 0), 0) / segments.length;
  const avgConversion = segments.filter(s => s.conversionRate).reduce((sum, segment) => sum + (segment.conversionRate || 0), 0) / segments.filter(s => s.conversionRate).length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="font-bold text-charcoal text-lg">Total Segmented Users</p>
              <p className="font-mono font-medium text-forest-green text-3xl mt-2">
                {totalUsers.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="font-bold text-charcoal text-lg">Avg. Engagement</p>
              <p className="font-mono font-medium text-forest-green text-3xl mt-2">
                {avgEngagement.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="font-bold text-charcoal text-lg">Avg. Conversion</p>
              <p className="font-mono font-medium text-forest-green text-3xl mt-2">
                {avgConversion.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            Segment Performance Comparison
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Compare key metrics across all segments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-gray/20">
                  <th className="text-left font-bold text-charcoal text-lg p-3">Segment</th>
                  <th className="text-left font-bold text-charcoal text-lg p-3">Users</th>
                  <th className="text-left font-bold text-charcoal text-lg p-3">Engagement</th>
                  <th className="text-left font-bold text-charcoal text-lg p-3">Conversion</th>
                  <th className="text-left font-bold text-charcoal text-lg p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.id} className="border-b border-stone-gray/10">
                    <td className="p-3">
                      <p className="font-bold text-charcoal text-base">{segment.name}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-mono text-forest-green text-base">
                        {segment.userCount.toLocaleString()}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-mono text-forest-green text-base">
                        {segment.engagementScore}%
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-mono text-forest-green text-base">
                        {segment.conversionRate ? `${segment.conversionRate}%` : 'N/A'}
                      </p>
                    </td>
                    <td className="p-3">
                      <Badge 
                        className={segment.status === 'active' 
                          ? 'bg-forest-green text-paper-white'
                          : segment.status === 'draft'
                          ? 'bg-equipment-yellow text-charcoal'
                          : 'bg-stone-gray text-paper-white'
                        }
                      >
                        {segment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Targeting Rules Manager Component
function TargetingRulesManager() {
  const targetingFields = [
    { value: 'plan', label: 'Subscription Plan', type: 'plan' },
    { value: 'registration_date', label: 'Registration Date', type: 'user_property' },
    { value: 'last_activity', label: 'Last Activity', type: 'behavior' },
    { value: 'surveys_completed', label: 'Surveys Completed', type: 'behavior' },
    { value: 'surveys_created', label: 'Surveys Created', type: 'behavior' },
    { value: 'engagement_score', label: 'Engagement Score', type: 'engagement' },
    { value: 'team_size', label: 'Team Size', type: 'user_property' },
    { value: 'industry', label: 'Industry', type: 'user_property' },
    { value: 'company_size', label: 'Company Size', type: 'user_property' },
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'last_n_days', label: 'In the last N days' },
    { value: 'older_than', label: 'Older than N days' },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            Available Targeting Fields
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Use these fields to create segment criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {targetingFields.map((field) => (
              <Card key={field.value} className="bg-light-concrete/50 border border-stone-gray/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-forest-green" />
                    <div>
                      <p className="font-bold text-charcoal text-base">{field.label}</p>
                      <Badge variant="outline" className="text-sm">
                        {field.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            Supported Operators
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Logical operators for defining segment conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {operators.map((operator) => (
              <div key={operator.value} className="flex items-center gap-3 p-3 bg-light-concrete/50 rounded-lg">
                <Filter className="w-4 h-4 text-forest-green" />
                <span className="font-bold text-charcoal text-base">{operator.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
