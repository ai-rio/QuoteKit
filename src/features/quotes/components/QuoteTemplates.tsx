'use client';

import { 
  Copy,
  Edit2,
  FileText,
  Plus,
  Trash2} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Quote } from '../types';

interface QuoteTemplatesProps {
  templates: Quote[];
  regularQuotes: Quote[]; // Add regular quotes for template creation
  onCreateTemplate: (templateName: string, baseQuote: Quote) => Promise<void>;
  onUseTemplate: (template: Quote) => void;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onUpdateTemplate: (templateId: string, templateName: string) => Promise<void>;
}

export function QuoteTemplates({
  templates,
  regularQuotes,
  onCreateTemplate,
  onUseTemplate,
  onDeleteTemplate,
  onUpdateTemplate
}: QuoteTemplatesProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Quote | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');

  const handleCreateTemplate = async () => {
    if (!templateName.trim() || !selectedQuote) return;

    setIsLoading(true);
    try {
      await onCreateTemplate(templateName.trim(), selectedQuote);
      setTemplateName('');
      setSelectedQuote(null);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !editTemplateName.trim()) return;

    setIsLoading(true);
    try {
      await onUpdateTemplate(editingTemplate.id, editTemplateName.trim());
      setEditingTemplate(null);
      setEditTemplateName('');
    } catch (error) {
      console.error('Failed to update template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Quote Templates</h2>
          <p className="text-charcoal/60 mt-1">
            Save frequently used quotes as templates for quick reuse
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-forest-green text-white hover:opacity-90 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-paper-white border-stone-gray max-w-md">
            <DialogHeader>
              <DialogTitle className="text-charcoal">Create Quote Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="template-name" className="text-charcoal font-medium">
                  Template Name
                </Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Standard Lawn Maintenance"
                  className="bg-light-concrete border-stone-gray text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-charcoal font-medium">
                  Base Quote
                </Label>
                <Select
                  value={selectedQuote?.id || ''}
                  onValueChange={(value) => {
                    const quote = regularQuotes.find(q => q.id === value);
                    setSelectedQuote(quote || null);
                  }}
                >
                  <SelectTrigger className="bg-light-concrete border-stone-gray text-charcoal focus:border-forest-green focus:ring-forest-green">
                    <SelectValue placeholder="Select a quote to use as template" />
                  </SelectTrigger>
                  <SelectContent className="bg-paper-white border-stone-gray">
                    {regularQuotes.length === 0 ? (
                      <SelectItem value="no-quotes" disabled>
                        No quotes available
                      </SelectItem>
                    ) : (
                      regularQuotes.map((quote) => (
                        <SelectItem 
                          key={quote.id} 
                          value={quote.id}
                          className="text-charcoal hover:bg-light-concrete/50"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{quote.client_name}</span>
                            <span className="text-xs text-charcoal/60">
                              {quote.quote_data?.length || 0} items • ${quote.total?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedQuote && (
                  <div className="text-xs text-charcoal/60 bg-light-concrete/50 p-2 rounded">
                    <strong>Preview:</strong> {selectedQuote.quote_data?.length || 0} items, 
                    Tax: {((selectedQuote.tax_rate || 0) * 100).toFixed(1)}%, 
                    Markup: {((selectedQuote.markup_rate || 0) * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="bg-paper-white border-stone-gray text-charcoal hover:bg-stone-gray/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!templateName.trim() || !selectedQuote || isLoading}
                  className="bg-forest-green text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="bg-paper-white border border-stone-gray">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-charcoal/40 mb-4" />
            <h3 className="text-lg font-medium text-charcoal mb-2">No Templates Yet</h3>
            <p className="text-charcoal/60 text-center mb-6 max-w-md">
              Create templates from your existing quotes to speed up future quote creation for similar services.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-forest-green text-white hover:opacity-90 font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="bg-paper-white border border-stone-gray hover:border-forest-green/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-charcoal text-lg">
                      {template.template_name || 'Unnamed Template'}
                    </CardTitle>
                    <CardDescription className="text-charcoal/60">
                      {template.quote_data.length} item{template.quote_data.length !== 1 ? 's' : ''} • {formatCurrency(template.total)}
                    </CardDescription>
                  </div>
                  <FileText className="w-5 h-5 text-forest-green" />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm text-charcoal/70">
                    <div className="font-medium">Sample Client: {template.client_name}</div>
                    <div>Tax: {(template.tax_rate * 100).toFixed(1)}% • Markup: {(template.markup_rate * 100).toFixed(1)}%</div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onUseTemplate(template)}
                      className="flex-1 bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal font-bold"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Use Template
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTemplate(template);
                        setEditTemplateName(template.template_name || '');
                      }}
                      className="bg-paper-white border-stone-gray text-charcoal hover:bg-stone-gray/20"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteTemplate(template.id)}
                      className="bg-paper-white border-stone-gray text-charcoal hover:bg-stone-gray/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Template Name Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="bg-paper-white border-stone-gray max-w-md">
          <DialogHeader>
            <DialogTitle className="text-charcoal">Edit Template Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-template-name" className="text-charcoal font-medium">
                Template Name
              </Label>
              <Input
                id="edit-template-name"
                value={editTemplateName}
                onChange={(e) => setEditTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="bg-light-concrete border-stone-gray text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setEditingTemplate(null)}
                className="bg-paper-white border-stone-gray text-charcoal hover:bg-stone-gray/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTemplate}
                disabled={!editTemplateName.trim() || isLoading}
                className="bg-forest-green text-white hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}