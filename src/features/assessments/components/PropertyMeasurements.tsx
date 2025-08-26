'use client';

import { Calculator, MapPin, Ruler, Square, Upload, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface PropertyMeasurementsProps {
  formData: {
    lawn_area_measured?: number | '';
    lawn_area_estimated?: number | '';
    total_property_area?: number | '';
    driveway_area?: number | '';
    walkway_area?: number | '';
    patio_area?: number | '';
    garden_bed_area?: number | '';
    tree_count: number | '';
    shrub_count: number | '';
    obstacle_count: number | '';
    slope_grade_percent?: number | '';
    access_width_feet?: number | '';
    fence_height_feet?: number | '';
    measurement_method: 'measured' | 'estimated' | 'satellite';
    measurement_notes?: string;
    photos_taken_count: number | '';
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

interface MeasurementArea {
  id: string;
  name: string;
  area: number;
  unit: 'sq_ft' | 'sq_m';
  notes?: string;
}

export function PropertyMeasurements({ formData, errors, onChange }: PropertyMeasurementsProps) {
  const [customAreas, setCustomAreas] = useState<MeasurementArea[]>([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaSize, setNewAreaSize] = useState<number | ''>('');
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);

  // Calculate total measured area
  const calculateTotalArea = () => {
    const areas = [
      formData.lawn_area_measured,
      formData.driveway_area,
      formData.walkway_area,
      formData.patio_area,
      formData.garden_bed_area,
      ...customAreas.map(area => area.area)
    ];
    
    return areas.reduce((total: number, area) => {
      const numArea = typeof area === 'number' ? area : (typeof area === 'string' && area !== '' ? parseFloat(area) : 0);
      return total + (isNaN(numArea) ? 0 : numArea);
    }, 0);
  };

  const addCustomArea = () => {
    if (!newAreaName.trim() || !newAreaSize) {
      toast({
        title: 'Error',
        description: 'Please enter both area name and size',
        variant: 'destructive',
      });
      return;
    }

    const newArea: MeasurementArea = {
      id: Date.now().toString(),
      name: newAreaName.trim(),
      area: typeof newAreaSize === 'number' ? newAreaSize : (newAreaSize !== '' ? parseFloat(String(newAreaSize)) : 0),
      unit: 'sq_ft'
    };

    setCustomAreas([...customAreas, newArea]);
    setNewAreaName('');
    setNewAreaSize('');
  };

  const removeCustomArea = (id: string) => {
    setCustomAreas(customAreas.filter(area => area.id !== id));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast({
        title: 'Warning',
        description: 'Some files were skipped. Only image files are allowed.',
        variant: 'destructive',
      });
    }

    setUploadedPhotos([...uploadedPhotos, ...validFiles]);
    onChange('photos_taken_count', uploadedPhotos.length + validFiles.length);
  };

  const removePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(newPhotos);
    onChange('photos_taken_count', newPhotos.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Ruler className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Property Measurements</h3>
      </div>

      {/* Measurement Method */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="text-forest-green flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Measurement Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-charcoal font-medium">How were measurements taken?</Label>
              <Select 
                value={formData.measurement_method} 
                onValueChange={(value) => onChange('measurement_method', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select measurement method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="measured">Physical Measurement (Most Accurate)</SelectItem>
                  <SelectItem value="estimated">Visual Estimation</SelectItem>
                  <SelectItem value="satellite">Satellite/Aerial View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.measurement_notes !== undefined && (
              <div>
                <Label className="text-charcoal font-medium">Measurement Notes</Label>
                <Textarea
                  value={formData.measurement_notes}
                  onChange={(e) => onChange('measurement_notes', e.target.value)}
                  placeholder="Any specific notes about how measurements were taken..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Primary Areas */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="text-forest-green flex items-center gap-2">
            <Square className="h-5 w-5" />
            Primary Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Lawn Area (sq ft) *</Label>
              <Input
                type="number"
                value={formData.lawn_area_measured}
                onChange={(e) => onChange('lawn_area_measured', e.target.value ? parseFloat(e.target.value) : '')}
                className={errors.lawn_area_measured ? 'border-red-500' : ''}
                placeholder="Enter measured lawn area"
              />
              {errors.lawn_area_measured && (
                <p className="text-sm text-red-600">{errors.lawn_area_measured}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Estimated Lawn Area (sq ft)</Label>
              <Input
                type="number"
                value={formData.lawn_area_estimated}
                onChange={(e) => onChange('lawn_area_estimated', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Backup estimate if measured unavailable"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Total Property Area (sq ft)</Label>
              <Input
                type="number"
                value={formData.total_property_area}
                onChange={(e) => onChange('total_property_area', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Total property size"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Driveway Area (sq ft)</Label>
              <Input
                type="number"
                value={formData.driveway_area}
                onChange={(e) => onChange('driveway_area', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Driveway area"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Walkway Area (sq ft)</Label>
              <Input
                type="number"
                value={formData.walkway_area}
                onChange={(e) => onChange('walkway_area', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Walkways and paths"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Patio/Deck Area (sq ft)</Label>
              <Input
                type="number"
                value={formData.patio_area}
                onChange={(e) => onChange('patio_area', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Patio and deck areas"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Garden Bed Area (sq ft)</Label>
              <Input
                type="number"
                value={formData.garden_bed_area}
                onChange={(e) => onChange('garden_bed_area', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Landscaped garden areas"
              />
            </div>
          </div>

          {/* Total Area Calculator */}
          <Separator className="my-6" />
          <div className="bg-forest-green/5 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-charcoal font-medium">Total Measured Area:</span>
              <span className="text-xl font-bold text-forest-green">
                {(calculateTotalArea() || 0).toLocaleString()} sq ft
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Areas */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="text-forest-green">Custom Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Custom Area */}
            <div className="flex gap-3">
              <Input
                placeholder="Area name (e.g., Pool Area)"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Size (sq ft)"
                value={newAreaSize}
                onChange={(e) => setNewAreaSize(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-32"
              />
              <Button onClick={addCustomArea} variant="outline">
                Add
              </Button>
            </div>

            {/* Custom Areas List */}
            {customAreas.length > 0 && (
              <div className="space-y-2">
                {customAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-charcoal">{area.name}</span>
                      <span className="text-charcoal-600 ml-2">{area.area.toLocaleString()} sq ft</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomArea(area.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Obstacles and Features */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="text-forest-green">Obstacles & Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Tree Count</Label>
              <Input
                type="number"
                value={formData.tree_count}
                onChange={(e) => onChange('tree_count', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Number of trees"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Shrub Count</Label>
              <Input
                type="number"
                value={formData.shrub_count}
                onChange={(e) => onChange('shrub_count', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Number of shrubs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Other Obstacles</Label>
              <Input
                type="number"
                value={formData.obstacle_count}
                onChange={(e) => onChange('obstacle_count', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Rocks, structures, etc."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Slope Grade (%)</Label>
              <Input
                type="number"
                value={formData.slope_grade_percent}
                onChange={(e) => onChange('slope_grade_percent', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Average slope percentage"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Access Width (ft)</Label>
              <Input
                type="number"
                value={formData.access_width_feet}
                onChange={(e) => onChange('access_width_feet', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Gate/access width"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-charcoal font-medium">Fence Height (ft)</Label>
              <Input
                type="number"
                value={formData.fence_height_feet}
                onChange={(e) => onChange('fence_height_feet', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Average fence height"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Documentation */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="text-forest-green flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Photo Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-charcoal font-medium">Upload Property Photos</Label>
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-forest-green hover:bg-forest-green/5 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-charcoal-600">Click to upload photos</span>
                    <p className="text-sm text-charcoal-400 mt-1">PNG, JPG up to 10MB each</p>
                  </div>
                </Label>
              </div>
            </div>

            {/* Photo Preview */}
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                      onLoad={() => URL.revokeObjectURL(URL.createObjectURL(photo))}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-charcoal-600">
              <span>Photos taken: {uploadedPhotos.length}</span>
              {uploadedPhotos.length > 0 && (
                <span>Total size: {(uploadedPhotos.reduce((total, file) => total + file.size, 0) / 1024 / 1024).toFixed(1)} MB</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
