"use client"

/**
 * Survey Responses List Component
 * FB-013: Display and filter survey responses
 */

import { 
  ArrowUpDown, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Eye,
  Filter, 
  MoreHorizontal,
  Search} from 'lucide-react';
import { useMemo,useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { AnalyticsLoadingState } from './analytics-loading-state';
import type { 
  FilterState, 
  FormbricksSurvey, 
  FormbricksSurveyResponse, 
  PaginationInfo, 
  ResponseListFilters} from './types';

interface SurveyResponsesListProps {
  responses: FormbricksSurveyResponse[];
  surveys: FormbricksSurvey[];
  loading?: boolean;
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
}

export function SurveyResponsesList({
  responses,
  surveys,
  loading = false,
  filters,
  onFiltersChange
}: SurveyResponsesListProps) {
  const [localFilters, setLocalFilters] = useState<ResponseListFilters>({
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [selectedResponse, setSelectedResponse] = useState<FormbricksSurveyResponse | null>(null);

  // Create survey lookup map
  const surveyMap = useMemo(() => {
    return surveys.reduce((acc, survey) => {
      acc[survey.id] = survey;
      return acc;
    }, {} as Record<string, FormbricksSurvey>);
  }, [surveys]);

  // Filter and sort responses
  const filteredAndSortedResponses = useMemo(() => {
    let filtered = responses;

    // Apply search filter
    if (localFilters.searchTerm) {
      const searchTerm = localFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(response => {
        const survey = surveyMap[response.surveyId];
        const surveyName = survey?.name?.toLowerCase() || '';
        const responseData = JSON.stringify(response.data).toLowerCase();
        const userId = response.userId?.toLowerCase() || '';
        
        return (
          surveyName.includes(searchTerm) ||
          responseData.includes(searchTerm) ||
          userId.includes(searchTerm) ||
          response.id.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Apply survey filter
    if (localFilters.surveyId) {
      filtered = filtered.filter(response => response.surveyId === localFilters.surveyId);
    }

    // Apply completion filter
    if (localFilters.completed !== undefined) {
      filtered = filtered.filter(response => response.finished === localFilters.completed);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (localFilters.sortBy) {
        case 'survey':
          aValue = surveyMap[a.surveyId]?.name || '';
          bValue = surveyMap[b.surveyId]?.name || '';
          break;
        case 'completion':
          aValue = a.finished;
          bValue = b.finished;
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      
      if (localFilters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [responses, localFilters, surveyMap]);

  // Pagination
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(filteredAndSortedResponses.length / filters.limit);
  const startIndex = filters.offset;
  const endIndex = Math.min(startIndex + filters.limit, filteredAndSortedResponses.length);
  const paginatedResponses = filteredAndSortedResponses.slice(startIndex, endIndex);
  
  const paginationInfo: PaginationInfo = {
    currentPage,
    totalPages,
    pageSize: filters.limit,
    totalItems: filteredAndSortedResponses.length
  };

  const handlePageChange = (page: number) => {
    onFiltersChange({ offset: (page - 1) * filters.limit });
  };

  const handleLocalFilterChange = (key: keyof ResponseListFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (sortBy: ResponseListFilters['sortBy']) => {
    const newSortOrder = localFilters.sortBy === sortBy && localFilters.sortOrder === 'desc' 
      ? 'asc' 
      : 'desc';
    
    setLocalFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: newSortOrder
    }));
  };

  if (loading) {
    return <AnalyticsLoadingState variant="list" />;
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="text-lg">Survey Responses</CardTitle>
              <CardDescription>
                {paginationInfo.totalItems} total responses
              </CardDescription>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal/50" />
                <Input
                  placeholder="Search responses..."
                  value={localFilters.searchTerm}
                  onChange={(e) => handleLocalFilterChange('searchTerm', e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              
              {/* Survey Filter */}
              <Select
                value={localFilters.surveyId || 'all'}
                onValueChange={(value) => 
                  handleLocalFilterChange('surveyId', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All surveys" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All surveys</SelectItem>
                  {surveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Results Table */}
          <div className="border border-stone-gray/30 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-light-concrete">
                  <TableHead className="w-12">
                    <CheckCircle className="h-4 w-4" />
                  </TableHead>
                  
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('survey')}
                      className="font-medium p-0 h-auto hover:bg-transparent"
                    >
                      Survey
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  
                  <TableHead className="hidden md:table-cell">
                    User
                  </TableHead>
                  
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('date')}
                      className="font-medium p-0 h-auto hover:bg-transparent"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('completion')}
                      className="font-medium p-0 h-auto hover:bg-transparent"
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {paginatedResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-3">
                        <Filter className="h-8 w-8 text-charcoal/30" />
                        <div>
                          <p className="text-charcoal/70 font-medium">
                            No responses found
                          </p>
                          <p className="text-sm text-charcoal/50">
                            Try adjusting your filters or search terms
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedResponses.map((response) => {
                    const survey = surveyMap[response.surveyId];
                    return (
                      <TableRow key={response.id} className="hover:bg-light-concrete/50">
                        <TableCell>
                          {response.finished ? (
                            <CheckCircle className="h-4 w-4 text-success-green" />
                          ) : (
                            <Clock className="h-4 w-4 text-equipment-yellow" />
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-charcoal line-clamp-1">
                              {survey?.name || 'Unknown Survey'}
                            </p>
                            <p className="text-xs text-charcoal/60">
                              ID: {response.id.substring(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {response.userId 
                                  ? response.userId.substring(0, 2).toUpperCase()
                                  : 'AN'
                                }
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-charcoal/70">
                              {response.userId ? (
                                response.userId.substring(0, 8) + '...'
                              ) : (
                                'Anonymous'
                              )}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm text-charcoal">
                              {new Date(response.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-charcoal/60">
                              {new Date(response.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge 
                            variant={response.finished ? 'default' : 'secondary'}
                            className={response.finished 
                              ? 'bg-success-green/10 text-success-green border-success-green/20' 
                              : 'bg-equipment-yellow/10 text-equipment-yellow border-equipment-yellow/20'
                            }
                          >
                            {response.finished ? 'Completed' : 'In Progress'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedResponse(response)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
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
          
          {/* Pagination */}
          {paginationInfo.totalPages > 1 && (
            <div className="flex flex-col space-y-4 mt-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <p className="text-sm text-charcoal/70">
                Showing {startIndex + 1}-{endIndex} of {paginationInfo.totalItems} responses
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {paginationInfo.totalPages > 5 && (
                    <span className="text-charcoal/70">...</span>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === paginationInfo.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Response Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Response Details
            </DialogTitle>
            <DialogDescription>
              {selectedResponse && surveyMap[selectedResponse.surveyId]?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResponse && (
            <div className="space-y-6">
              {/* Response Meta */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-light-concrete rounded-lg">
                <div>
                  <p className="text-sm font-medium text-charcoal">Response ID</p>
                  <p className="text-sm text-charcoal/70 font-mono">{selectedResponse.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">Status</p>
                  <Badge 
                    variant={selectedResponse.finished ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {selectedResponse.finished ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">Created</p>
                  <p className="text-sm text-charcoal/70">
                    {new Date(selectedResponse.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">Updated</p>
                  <p className="text-sm text-charcoal/70">
                    {new Date(selectedResponse.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {/* Response Data */}
              <div>
                <h4 className="text-lg font-semibold text-charcoal mb-4">Response Data</h4>
                <div className="bg-slate-50 rounded-lg p-4 border border-stone-gray/30">
                  <pre className="text-sm text-charcoal whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(selectedResponse.data, null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* Meta Information */}
              {selectedResponse.meta && (
                <div>
                  <h4 className="text-lg font-semibold text-charcoal mb-4">Meta Information</h4>
                  <div className="space-y-3">
                    {selectedResponse.meta.source && (
                      <div>
                        <p className="text-sm font-medium text-charcoal">Source</p>
                        <p className="text-sm text-charcoal/70">{selectedResponse.meta.source}</p>
                      </div>
                    )}
                    {selectedResponse.meta.url && (
                      <div>
                        <p className="text-sm font-medium text-charcoal">URL</p>
                        <p className="text-sm text-charcoal/70 break-all">{selectedResponse.meta.url}</p>
                      </div>
                    )}
                    {selectedResponse.meta.userAgent && (
                      <div>
                        <p className="text-sm font-medium text-charcoal">User Agent</p>
                        <p className="text-sm text-charcoal/70 break-all">{selectedResponse.meta.userAgent}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {selectedResponse.tags && selectedResponse.tags.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-charcoal mb-4">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResponse.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}