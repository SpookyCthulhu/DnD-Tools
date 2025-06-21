import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUploader = ({ onImageLoaded }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageLoaded(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false
  });

  return (
    <div 
            {...getRootProps()} 
            className={`h-full flex items-center justify-center border-2 border-dashed cursor-pointer transition-colors rounded-lg ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <p className="text-xl text-gray-600 mb-2">
                {isDragActive ? 'Drop your map image here' : 'Drop a map image here or click to select'}
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, GIF, BMP, WebP
              </p>
            </div>
          </div>
  );
};

export default ImageUploader;
