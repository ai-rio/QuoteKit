'use client';

import { useState } from 'react';
import { Clock,Save } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SaveDraftButtonProps {
  onSave: () => Promise<void> | void;
  hasUnsavedChanges: boolean;
  lastSaveTime: Date | null;
  disabled?: boolean;
}

export function SaveDraftButton({
  onSave,
  hasUnsavedChanges,
  lastSaveTime,
  disabled = false,
}: SaveDraftButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={handleSave}
        disabled={disabled || isSaving}
        className="border-[#D7D7D7] text-[#1C1C1C] hover:bg-[#F5F5F5]"
      >
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Draft'}
      </Button>
      
      {hasUnsavedChanges && (
        <Badge variant="secondary" className="bg-[#F2B705]/20 text-[#1C1C1C]">
          <Clock className="w-3 h-3 mr-1" />
          Unsaved
        </Badge>
      )}
      
      {lastSaveTime && !hasUnsavedChanges && (
        <Badge variant="outline" className="border-green-200 text-green-700">
          Saved
        </Badge>
      )}
    </div>
  );
}