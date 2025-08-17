"use client"

/**
 * Data Export Interface Component
 * FB-013: Export analytics data in various formats
 */

import { AlertCircle,CheckCircle, Database, Download, FileText, Loader2, Table } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import type { ExportOptions,FilterState, FormbricksAnalyticsData } from './types';

interface DataExportInterfaceProps {
  data: FormbricksAnalyticsData;
  filters: FilterState;
  onExport?: () => void;
}

type ExportStatus = 'idle' | 'preparing' | 'exporting' | 'completed' | 'error';

export function DataExportInterface({
  data,
  filters,
  onExport
}: DataExportInterfaceProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeResponses: true,
    includeMetrics: true,
    dateRange: filters.dateRange,
    surveyIds: filters.surveyIds
  });
  
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Calculate export size estimation
  const getExportEstimate = () => {
    let items = 0;
    let sizeKB = 0;
    
    if (exportOptions.includeMetrics) {
      items += 1; // Metrics summary
      sizeKB += 2; // Small JSON/CSV
    }
    
    if (exportOptions.includeResponses) {
      const responseCount = exportOptions.surveyIds && exportOptions.surveyIds.length > 0
        ? data.responses.filter(r => exportOptions.surveyIds!.includes(r.surveyId)).length
        : data.responses.length;
      
      items += responseCount;
      sizeKB += responseCount * 1.5; // Estimate ~1.5KB per response
    }
    
    return {
      items,
      sizeKB: Math.round(sizeKB),
      sizeMB: Math.round(sizeKB / 1024 * 10) / 10
    };
  };

  const estimate = getExportEstimate();

  const handleExportOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
    setExportError(null);
  };

  const simulateExport = async () => {
    setExportStatus('preparing');
    setExportProgress(0);
    setExportError(null);
    setDownloadUrl(null);
    
    try {
      // Simulate preparation phase
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExportProgress(25);
      
      setExportStatus('exporting');
      
      // Simulate export progress
      for (let i = 25; i <= 90; i += 15) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setExportProgress(i);
      }
      
      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExportProgress(100);
      
      // Generate mock download URL
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `formbricks-analytics-${timestamp}.${exportOptions.format}`;
      
      // In a real implementation, this would be an actual file URL
      setDownloadUrl(`/api/exports/${filename}`);
      setExportStatus('completed');
      
      // Trigger callback
      onExport?.();
      
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
      setExportStatus('error');
    }
  };

  const resetExport = () => {
    setExportStatus('idle');
    setExportProgress(0);
    setExportError(null);
    setDownloadUrl(null);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return Table;
      case 'json': return Database;
      case 'excel': return FileText;
      default: return Download;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv': return 'Comma-separated values, ideal for spreadsheet analysis';
      case 'json': return 'JSON format, perfect for developers and APIs';
      case 'excel': return 'Excel workbook with formatted sheets and charts';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Status */}
      {exportStatus !== 'idle' && (
        <Alert className={`${
          exportStatus === 'completed' 
            ? 'border-success-green bg-success-green/5' 
            : exportStatus === 'error' 
              ? 'border-red-500 bg-red-50' 
              : 'border-blue-500 bg-blue-50'
        }`}>
          {exportStatus === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-success-green" />
          ) : exportStatus === 'error' ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          )}
          
          <AlertDescription>
            {exportStatus === 'preparing' && (
              <div className="space-y-2">
                <p className="font-medium text-blue-800">Preparing your export...</p>
                <Progress value={exportProgress} className="h-2" />
              </div>
            )}
            {exportStatus === 'exporting' && (
              <div className="space-y-2">
                <p className="font-medium text-blue-800">
                  Exporting {estimate.items} items... ({exportProgress}%)
                </p>
                <Progress value={exportProgress} className="h-2" />
              </div>
            )}
            {exportStatus === 'completed' && (
              <div className="space-y-3">
                <p className="font-medium text-success-green">
                  Export completed successfully!
                </p>
                {downloadUrl && (
                  <div className="flex space-x-2">
                    <Button size="sm" asChild className="bg-success-green hover:bg-success-green/90">
                      <a href={downloadUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetExport}>
                      Export Again
                    </Button>
                  </div>
                )}
              </div>
            )}
            {exportStatus === 'error' && (
              <div className="space-y-3">
                <p className="font-medium text-red-800">Export failed</p>
                <p className="text-sm text-red-600">{exportError}</p>
                <Button variant="outline" size="sm" onClick={resetExport}>
                  Try Again
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Format Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export Format</CardTitle>
            <CardDescription>
              Choose the format that best suits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={exportOptions.format}
              onValueChange={(value) => handleExportOptionChange('format', value as ExportOptions['format'])}
              className="space-y-4"
            >
              {[
                { value: 'csv', label: 'CSV', desc: 'Comma-separated values' },
                { value: 'json', label: 'JSON', desc: 'JavaScript Object Notation' },
                { value: 'excel', label: 'Excel', desc: 'Microsoft Excel workbook' }
              ].map((format: any) => {
                const IconComponent = getFormatIcon(format.value);
                return (
                  <div key={format.value} className="flex items-start space-x-3 p-3 border border-stone-gray/30 rounded-lg hover:bg-light-concrete transition-colors">
                    <RadioGroupItem value={format.value} id={format.value} className="mt-1" />
                    <div className="flex-1">
                      <label htmlFor={format.value} className="flex items-center space-x-3 cursor-pointer">
                        <IconComponent className="h-5 w-5 text-charcoal/70" />
                        <div>
                          <p className="font-medium text-charcoal">{format.label}</p>
                          <p className="text-sm text-charcoal/70">{getFormatDescription(format.value)}</p>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Data Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Selection</CardTitle>
            <CardDescription>
              Choose what data to include in your export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Include Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={exportOptions.includeResponses}
                  onCheckedChange={(checked) => 
                    handleExportOptionChange('includeResponses', checked)
                  }
                />
                <Label htmlFor="include-responses" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Survey Responses</p>
                    <p className="text-sm text-charcoal/70">
                      Individual response data ({data.responses.length} responses)
                    </p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={exportOptions.includeMetrics}
                  onCheckedChange={(checked) => 
                    handleExportOptionChange('includeMetrics', checked)
                  }
                />
                <Label htmlFor="include-metrics" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Analytics Metrics</p>
                    <p className="text-sm text-charcoal/70">
                      Summary statistics and completion rates
                    </p>
                  </div>
                </Label>
              </div>
            </div>
            
            <Separator />
            
            {/* Survey Filter */}
            {exportOptions.includeResponses && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Survey Filter</Label>
                <Select
                  value={exportOptions.surveyIds?.length === 0 ? 'all' : 'selected'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      handleExportOptionChange('surveyIds', []);
                    } else {
                      handleExportOptionChange('surveyIds', filters.surveyIds);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All surveys ({data.surveys.length} surveys)
                    </SelectItem>
                    <SelectItem value="selected">
                      Current filter ({filters.surveyIds.length} surveys)
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {exportOptions.surveyIds && exportOptions.surveyIds.length > 0 && (
                  <div className="p-3 bg-light-concrete rounded-lg">
                    <p className="text-sm font-medium text-charcoal mb-2">
                      Selected Surveys:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {exportOptions.surveyIds.slice(0, 3).map((surveyId) => {
                        const survey = data.surveys.find(s => s.id === surveyId);
                        return survey ? (
                          <Badge key={surveyId} variant="secondary" className="text-xs">
                            {survey.name.length > 15 ? `${survey.name.substring(0, 15)}...` : survey.name}
                          </Badge>
                        ) : null;
                      })}
                      {exportOptions.surveyIds.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{exportOptions.surveyIds.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Summary</CardTitle>
          <CardDescription>
            Review your export configuration before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-light-concrete rounded-lg text-center">
                <p className="text-sm text-charcoal/70">Format</p>
                <p className="font-mono font-bold text-charcoal uppercase">
                  {exportOptions.format}
                </p>
              </div>
              <div className="p-3 bg-light-concrete rounded-lg text-center">
                <p className="text-sm text-charcoal/70">Items</p>
                <p className="font-mono font-bold text-charcoal">
                  {estimate.items.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-light-concrete rounded-lg text-center">
                <p className="text-sm text-charcoal/70">Size</p>
                <p className="font-mono font-bold text-charcoal">
                  {estimate.sizeMB > 1 ? `${estimate.sizeMB} MB` : `${estimate.sizeKB} KB`}
                </p>
              </div>
              <div className="p-3 bg-light-concrete rounded-lg text-center">
                <p className="text-sm text-charcoal/70">Date Range</p>
                <p className="font-mono font-bold text-charcoal text-xs">
                  {exportOptions.dateRange ? (
                    `${Math.ceil((exportOptions.dateRange.end.getTime() - exportOptions.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))}d`
                  ) : (
                    'All time'
                  )}
                </p>
              </div>
            </div>
            
            {/* Export Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={simulateExport}
                disabled={exportStatus !== 'idle' || (!exportOptions.includeResponses && !exportOptions.includeMetrics)}
                size="lg"
                className="min-w-48"
              >
                {exportStatus === 'idle' ? (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Start Export
                  </>
                ) : (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Exporting...
                  </>
                )}
              </Button>
            </div>
            
            {!exportOptions.includeResponses && !exportOptions.includeMetrics && (
              <p className="text-center text-sm text-charcoal/60">
                Please select at least one data type to export
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}