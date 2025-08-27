'use client';

import { Camera, FileText, Image,Video } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { MediaGalleryProps } from './types';

export function MediaGallery({ assessment, media }: MediaGalleryProps) {
  // If no media is provided, show a placeholder
  if (!media || media.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-forest-green flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Assessment Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-charcoal/50">
            <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No media files available for this assessment</p>
            <p className="text-sm mt-1">Photos and videos will appear here when uploaded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMediaIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'photo':
      case 'image':
        return <Camera className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMediaTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'photo':
      case 'image':
        return 'bg-blue-100 text-blue-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-forest-green flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Assessment Media ({media.length} files)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item, index) => (
            <div key={item.id || index} className="border rounded-lg overflow-hidden">
              {/* Media Preview */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {item.type.toLowerCase() === 'photo' || item.type.toLowerCase() === 'image' ? (
                  item.url ? (
                    <img 
                      src={item.url} 
                      alt={item.description || item.caption || 'Assessment photo'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-charcoal" />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 text-charcoal">
                    {getMediaIcon(item.type)}
                    <span className="text-sm font-medium">{item.type.toUpperCase()}</span>
                  </div>
                )}
              </div>
              
              {/* Media Info */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getMediaTypeColor(item.type)}>
                    {getMediaIcon(item.type)}
                    <span className="ml-1">{item.type}</span>
                  </Badge>
                </div>
                
                {item.caption && (
                  <div className="text-sm font-medium mb-1">{item.caption}</div>
                )}
                
                {item.description && (
                  <div className="text-xs text-charcoal">{item.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Media Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex gap-4 text-sm text-charcoal">
            <span>
              Photos: {media.filter(m => m.type.toLowerCase() === 'photo' || m.type.toLowerCase() === 'image').length}
            </span>
            <span>
              Videos: {media.filter(m => m.type.toLowerCase() === 'video').length}
            </span>
            <span>
              Other: {media.filter(m => !['photo', 'image', 'video'].includes(m.type.toLowerCase())).length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
