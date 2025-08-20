/**
 * Survey Responses Table Component
 * 
 * Displays survey responses in a filterable, sortable table format
 * with pagination and search capabilities.
 */

'use client';

import { format } from 'date-fns';
import { 
  Calendar,
  CheckCircle,
  ChevronDown,
  Download, 
  ExternalLink,
  Eye,
  Filter, 
  MoreVertical,
  RefreshCw,
  Search, 
  XCircle} from 'lucide-react';
import { useMemo,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FormbricksAnalyticsFilters,
  FormbricksAnalyticsSortOptions,
  FormbricksSurvey,
  FormbricksSurveyResponse} from '@/libs/formbricks/types';

interface SurveyResponsesTableProps {
  responses: FormbricksSurveyResponse[];
  surveys: FormbricksSurvey[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  filters: FormbricksAnalyticsFilters;
  sort: FormbricksAnalyticsSortOptions;
  onFiltersChange: (filters: FormbricksAnalyticsFilters) => void;
  onSortChange: (sort: FormbricksAnalyticsSortOptions) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onSearch: (term: string) => void;
}

export function SurveyResponsesTable({
  responses,
  surveys,
  total,
  hasMore,
  loading,
  error,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onLoadMore,
  onRefresh,
  onExport,
  onSearch,
}: SurveyResponsesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<FormbricksSurveyResponse | null>(null);

  // Create survey lookup map
  const surveysMap = useMemo(() => {
    return surveys.reduce((acc, survey) => {
      acc[survey.id] = survey;
      return acc;
    }, {} as Record<string, FormbricksSurvey>);
  }, [surveys]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleSortChange = (field: FormbricksAnalyticsSortOptions['field']) => {
    const newDirection = sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc';
    onSortChange({ field, direction: newDirection });
  };

  const getSortIcon = (field: string) => {
    if (sort.field !== field) return null;
    return sort.direction === 'desc' ? '↓' : '↑';
  };

  const formatResponseData = (data: Record<string, any>) => {
    const values = Object.values(data);
    if (values.length === 0) return 'No data';
    if (values.length === 1) return String(values[0]);
    return `${values.length} responses`;
  };

  const getCompletionBadge = (finished: boolean) => {
    return finished ? (
      <Badge variant="default" className="bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3 mr-1" />
        Complete
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
        <XCircle className="h-3 w-3 mr-1" />
        Incomplete
      </Badge>
    );
  };

  if (error) {
    return (
      <Card className="bg-white border-stone-gray/20">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-charcoal/70 mb-4">Failed to load responses</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-stone-gray/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-xl font-semibold text-charcoal">
            Survey Responses ({total.toLocaleString()})
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal/50" />
              <Input
                placeholder="Search responses..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <Select
              value={filters.surveyId || 'all'}
              onValueChange={(value) => 
                onFiltersChange({ 
                  ...filters, 
                  surveyId: value === 'all' ? undefined : value 
                })
              }
            >
              <SelectTrigger className="w-[160px] bg-light-concrete text-charcoal border-0 py-3 px-4 rounded-lg shadow-sm ring-1 ring-inset ring-stone-gray/50 focus:ring-2 focus:ring-inset focus:ring-forest-green">
                <SelectValue placeholder="All Surveys" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Surveys</SelectItem>
                {surveys.map((survey) => (
                  <SelectItem key={survey.id} value={survey.id}>
                    {survey.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.finished?.toString() || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  finished: value === 'all' ? undefined : value === 'true',
                })
              }
            >
              <SelectTrigger className="w-[140px] bg-light-concrete text-charcoal border-0 py-3 px-4 rounded-lg shadow-sm ring-1 ring-inset ring-stone-gray/50 focus:ring-2 focus:ring-inset focus:ring-forest-green">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Complete</SelectItem>
                <SelectItem value="false">Incomplete</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Refresh */}
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto"> {/* responsive table container */}
          <Table>
            <TableHeader>
              <TableRow className="border-stone-gray/20">
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 px-6"
                  onClick={() => handleSortChange('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="px-6">Survey</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 px-6"
                  onClick={() => handleSortChange('finished')}
                >
                  <div className="flex items-center gap-2">
                    Status {getSortIcon('finished')}
                  </div>
                </TableHead>
                <TableHead className="px-6">Response Data</TableHead>
                <TableHead className="px-6">Source</TableHead>
                <TableHead className="px-6 w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && responses.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-charcoal/70">
                    No responses found for the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((response) => {
                  const survey = surveysMap[response.surveyId];
                  return (
                    <TableRow key={response.id} className="border-stone-gray/20">
                      <TableCell className="px-6 font-mono text-sm">
                        {format(new Date(response.createdAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="max-w-[200px]">
                          <p className="font-medium text-charcoal truncate">
                            {survey?.name || 'Unknown Survey'}
                          </p>
                          <p className="text-xs text-charcoal/60 font-mono">
                            {response.surveyId.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        {getCompletionBadge(response.finished)}
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="max-w-[300px]">
                          <p className="text-sm text-charcoal truncate">
                            {formatResponseData(response.data)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <Badge variant="outline" className="text-xs">
                          {response.meta?.source || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => setSelectedResponse(response)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(response.meta?.url, '_blank')}
                              disabled={!response.meta?.url}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Source
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="p-6 border-t border-stone-gray/20 text-center">
            <Button 
              onClick={onLoadMore} 
              variant="outline" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}