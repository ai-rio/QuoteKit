'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CompanyProfileCardProps {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl: string | null;
  onFieldChange: (field: string, value: string) => void;
  onLogoChange: (file: File | null) => void;
}

export function CompanyProfileCard({
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  logoUrl,
  onFieldChange,
  onLogoChange,
}: CompanyProfileCardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return;
    }

    setUploading(true);
    onLogoChange(file);
    
    // Reset uploading state after a brief delay
    setTimeout(() => setUploading(false), 1000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const removeLogo = () => {
    onLogoChange(null);
  };

  return (
    <Card className="bg-paper-white border border-stone-gray shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-section-title text-charcoal">Company Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company Name */}
        <div className="grid gap-3">
          <Label htmlFor="company-name" className="text-label text-charcoal font-medium">
            Company Name *
          </Label>
          <Input
            id="company-name"
            name="company_name"
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            placeholder="Your Company Name"
            value={companyName}
            onChange={(e) => onFieldChange('company_name', e.target.value)}
            required
          />
        </div>

        {/* Company Address */}
        <div className="grid gap-3">
          <Label htmlFor="company-address" className="text-label text-charcoal font-medium">
            Business Address
          </Label>
          <Textarea
            id="company-address"
            name="company_address"
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 resize-none"
            placeholder="123 Main Street&#10;City, State 12345"
            rows={3}
            value={companyAddress}
            onChange={(e) => onFieldChange('company_address', e.target.value)}
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="company-phone" className="text-label text-charcoal font-medium">
              Phone Number
            </Label>
            <Input
              id="company-phone"
              name="company_phone"
              type="tel"
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="(555) 123-4567"
              value={companyPhone}
              onChange={(e) => onFieldChange('company_phone', e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="company-email" className="text-label text-charcoal font-medium">
              Business Email
            </Label>
            <Input
              id="company-email"
              name="company_email"
              type="email"
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="contact@yourcompany.com"
              value={companyEmail}
              onChange={(e) => onFieldChange('company_email', e.target.value)}
            />
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="grid gap-3">
          <Label className="text-label text-charcoal font-medium">Company Logo</Label>
          <div className="flex items-start gap-4">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <Avatar className="h-20 w-20">
                <AvatarImage src={logoUrl || ''} />
                <AvatarFallback className="bg-stone-gray/20 text-charcoal/60">
                  Logo
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Upload Controls */}
            <div className="flex-1 min-w-0">
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  dragActive
                    ? 'border-forest-green bg-forest-green/5'
                    : 'border-stone-gray bg-light-concrete'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-6 w-6 text-charcoal/60 mb-2" />
                <p className="text-sm text-charcoal/70 mb-2">
                  Drag and drop your logo here, or click to browse
                </p>
                <p className="text-xs text-charcoal/60 mb-3">
                  PNG, JPG or GIF (max 5MB)
                </p>
                
                <div className="flex items-center gap-2 justify-center">
                  <Button
                    type="button"
                    className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
                    disabled={uploading}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {uploading ? 'Uploading...' : 'Browse Files'}
                  </Button>
                  
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-stone-gray text-charcoal/70 hover:bg-stone-gray/20"
                      onClick={removeLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}