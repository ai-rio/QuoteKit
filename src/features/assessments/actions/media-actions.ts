// Media Actions - Refactored to use modular components
// This file provides backward compatibility while utilizing modular components

// Re-export all media operations for backward compatibility
export {
  approveMedia,
  bulkDeleteMedia,
  deleteAssessmentMedia} from './media/deletion';
export {
  getAssessmentMedia,
  getMediaById,
  reorderMedia,
  toggleMediaFeatured,
  updateAssessmentMedia} from './media/management';
export {
  generateStoragePath,
  inferMediaTypeFromFile,
  uploadAssessmentMedia,
  validateMediaFile} from './media/upload';