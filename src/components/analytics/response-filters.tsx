"use client"

/**
 * Response Filters Component
 * FB-013: Filtering interface for analytics dashboard
 */

import { Calendar, Filter, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import type { FilterState, FormbricksSurvey } from './types';

interface ResponseFiltersProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
  surveys: FormbricksSurvey[];
}

export function ResponseFilters({
  filters,
  onChange,
  surveys
}: ResponseFiltersProps) {
  const [datePickerOpen, setDatePickerOpen] = useState<'start' | 'end' | null>(null);

  const handleDateRangeChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    onChange({
      dateRange: {
        ...filters.dateRange,
        [type]: date
      }
    });
    setDatePickerOpen(null);
  };

  const handleSurveyToggle = (surveyId: string, checked: boolean) => {
    const newSurveyIds = checked
      ? [...filters.surveyIds, surveyId]
      : filters.surveyIds.filter(id => id !== surveyId);
    
    onChange({ surveyIds: newSurveyIds });
  };

  const handleCompletionFilter = (value: string) => {
    onChange({ 
      completed: value === 'all' ? undefined : value === 'completed'
    });
  };

  const handleLimitChange = (value: string) => {
    onChange({ limit: parseInt(value) });
  };

  const clearFilters = () => {
    onChange({
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      surveyIds: [],
      completed: undefined,
      limit: 50,
      offset: 0
    });
  };

  const activeFiltersCount = (
    (filters.surveyIds.length > 0 ? 1 : 0) +
    (filters.completed !== undefined ? 1 : 0) +
    (filters.limit !== 50 ? 1 : 0)
  );

  return (
    <div className="space-y-6">
      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-light-concrete rounded-lg">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-charcoal/70" />
            <span className="text-sm font-medium text-charcoal">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-charcoal/70 hover:text-charcoal"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-charcoal">
            Date Range
          </Label>
          <div className="space-y-2">
            <Popover 
              open={datePickerOpen === 'start'} 
              onOpenChange={(open) => setDatePickerOpen(open ? 'start' : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dateRange.start.toLocaleDateString()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateRange.start}
                  onSelect={(date) => handleDateRangeChange('start', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover 
              open={datePickerOpen === 'end'} 
              onOpenChange={(open) => setDatePickerOpen(open ? 'end' : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dateRange.end.toLocaleDateString()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateRange.end}
                  onSelect={(date) => handleDateRangeChange('end', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Completion Status */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-charcoal">
            Completion Status
          </Label>
          <Select
            value={
              filters.completed === undefined 
                ? 'all' 
                : filters.completed 
                  ? 'completed' 
                  : 'incomplete'
            }
            onValueChange={handleCompletionFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All responses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All responses</SelectItem>
              <SelectItem value="completed">Completed only</SelectItem>
              <SelectItem value="incomplete">Incomplete only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Limit */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-charcoal">
            Results per page
          </Label>
          <Select
            value={filters.limit.toString()}
            onValueChange={handleLimitChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Date Ranges */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-charcoal">
            Quick Ranges
          </Label>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onChange({
                dateRange: {
                  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  end: new Date()
                }
              })}
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onChange({
                dateRange: {
                  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  end: new Date()
                }
              })}
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onChange({
                dateRange: {
                  start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                  end: new Date()
                }
              })}
            >
              Last 90 days
            </Button>
          </div>
        </div>
      </div>

      {/* Survey Selection */}
      {surveys.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-charcoal">
            Surveys ({filters.surveyIds.length > 0 ? `${filters.surveyIds.length} selected` : 'All'})
          </Label>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {surveys.map((survey) => {
              const isSelected = filters.surveyIds.includes(survey.id);
              return (
                <div key={survey.id} className="flex items-start space-x-3 p-3 rounded-lg border border-stone-gray/30 hover:bg-light-concrete transition-colors">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => 
                      handleSurveyToggle(survey.id, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <label 
                      htmlFor={`survey-${survey.id}`}
                      className="text-sm font-medium text-charcoal cursor-pointer line-clamp-1"
                    >
                      {survey.name}
                    </label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant={survey.status === 'inProgress' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {survey.status}
                      </Badge>
                      <span className="text-xs text-charcoal/60">
                        {survey.responseCount} responses
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filters.surveyIds.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-wrap gap-1">
                {filters.surveyIds.slice(0, 3).map((surveyId) => {
                  const survey = surveys.find(s => s.id === surveyId);
                  return survey ? (
                    <Badge key={surveyId} variant="secondary" className="text-xs">
                      {survey.name.length > 20 ? `${survey.name.substring(0, 20)}...` : survey.name}
                    </Badge>
                  ) : null;
                })}
                {filters.surveyIds.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{filters.surveyIds.length - 3} more
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ surveyIds: [] })}
                className="text-xs text-charcoal/70 hover:text-charcoal"
              >
                Clear selection
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}