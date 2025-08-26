'use client';

import { Calendar, FileText, Filter,MapPin, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { AssessmentStatus,PropertyAssessment, PropertyAssessmentWithDetails } from '../types';
import { AssessmentCard } from './AssessmentCard';
import { AssessmentStats } from './AssessmentStats';

interface AssessmentsManagerProps {
  initialAssessments: PropertyAssessmentWithDetails[];
}

export function AssessmentsManager({ initialAssessments }: AssessmentsManagerProps) {
  const [assessments] = useState<PropertyAssessmentWithDetails[]>(initialAssessments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'condition'>('date');

  // Filter and sort assessments
  const filteredAssessments = useMemo(() => {
    let filtered = assessments.filter(assessment => {
      const matchesSearch = 
        assessment.assessment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.assessor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.properties?.service_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.properties?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || assessment.assessment_status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort assessments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime();
        case 'status':
          return a.assessment_status.localeCompare(b.assessment_status);
        case 'condition':
          const conditionOrder = { 'excellent': 0, 'good': 1, 'fair': 2, 'poor': 3, 'critical': 4 };
          const aOrder = conditionOrder[a.overall_condition as keyof typeof conditionOrder] ?? 5;
          const bOrder = conditionOrder[b.overall_condition as keyof typeof conditionOrder] ?? 5;
          return aOrder - bOrder;
        default:
          return 0;
      }
    });

    return filtered;
  }, [assessments, searchTerm, statusFilter, sortBy]);

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'requires_followup':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forest-green">Property Assessments</h1>
          <p className="text-charcoal-600 mt-1">
            Manage and track property assessments for accurate quoting
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-equipment-yellow hover:bg-equipment-yellow/90 text-charcoal">
            <Link href="/assessments/new">
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <AssessmentStats assessments={assessments} />

      {/* Filters and Search */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forest-green">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                <Input
                  placeholder="Search assessments, properties, or clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AssessmentStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="requires_followup">Needs Follow-up</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'status' | 'condition')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="condition">Condition</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-600">
          Showing {filteredAssessments.length} of {assessments.length} assessments
        </p>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="text-charcoal-600 hover:text-charcoal"
          >
            Clear search
          </Button>
        )}
      </div>

      {/* Assessments Grid */}
      {filteredAssessments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssessments.map((assessment) => (
            <AssessmentCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
      ) : (
        <Card className="bg-paper-white">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-charcoal mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No matching assessments' : 'No assessments yet'}
            </h3>
            <p className="text-charcoal-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first property assessment to get started with accurate quoting.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button asChild className="bg-equipment-yellow hover:bg-equipment-yellow/90 text-charcoal">
                <Link href="/assessments/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Assessment
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
