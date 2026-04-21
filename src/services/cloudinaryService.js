const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Validate environment variables
if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.error('Missing Cloudinary environment variables!');
}

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // File size validation (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // File type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported. Please upload image, PDF, or Word document');
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      { 
        method: 'POST', 
        body: formData 
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }
    
    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      bytes: data.bytes,
      resourceType: data.resource_type
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Upload profile picture (with image optimization)
export const uploadProfilePicture = async (file) => {
  const result = await uploadToCloudinary(file);
  
  // If it's an image, add transformation for better display
  if (result.resourceType === 'image') {
    // Create optimized version (200x200 crop, quality 80)
    const optimizedUrl = result.url.replace(
      '/upload/',
      '/upload/w_200,h_200,c_fill,q_80/'
    );
    return optimizedUrl;
  }
  
  return result.url;
};

// Upload portfolio image for freelancer
export const uploadPortfolioImage = async (file) => {
  const result = await uploadToCloudinary(file);
  
  // If it's an image, add transformation for portfolio display
  if (result.resourceType === 'image') {
    // Create optimized version (400x300 crop, quality 80)
    const optimizedUrl = result.url.replace(
      '/upload/',
      '/upload/w_400,h_300,c_fill,q_80/'
    );
    return optimizedUrl;
  }
  
  return result.url;
};

// Upload resume
export const uploadResume = async (file) => {
  const result = await uploadToCloudinary(file);
  return result.url;
};

// Upload company logo
export const uploadCompanyLogo = async (file) => {
  const result = await uploadToCloudinary(file);
  
  // Optimize logo for job cards (100x100, quality 80)
  if (result.resourceType === 'image') {
    const optimizedUrl = result.url.replace(
      '/upload/',
      '/upload/w_100,h_100,c_limit,q_80/'
    );
    return optimizedUrl;
  }
  
  return result.url;
};

// Delete file from Cloudinary (optional)
export const deleteFromCloudinary = async (publicId) => {
  // Note: This requires API secret, best done from backend
  // For now, we'll skip deletion or handle it server-side
  console.log('Deletion requested for:', publicId);
  return true;
};