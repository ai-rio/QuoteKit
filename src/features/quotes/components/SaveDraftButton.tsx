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
        onClick={handleSave}
        disabled={disabled || isSaving}
        className={`${disabled ? 'bg-paper-white' : 'bg-equipment-yellow'} text-charcoal hover:bg-stone-gray/20 active:bg-equipment-yellow border border-stone-gray`}
      >
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Draft'}
      </Button>
      
      {hasUnsavedChanges && (
        <Badge variant="secondary" className="bg-equipment-yellow/20 text-charcoal">
          <Clock className="w-3 h-3 mr-1" />
          Unsaved
        </Badge>
      )}
      
      {lastSaveTime && !hasUnsavedChanges && (
        <Badge variant="outline" className="border-forest-green text-forest-green">
          Saved
        </Badge>
      )}
    </div>
  );
}