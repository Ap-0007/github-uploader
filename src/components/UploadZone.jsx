import React, { useCallback, useState } from 'react';
import { UploadCloud, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const scanFiles = async (item) => {
  if (item.isFile) {
    return new Promise(resolve => {
      item.file(file => {
        // preserve the relative path from the drop
        // item.fullPath starts with a slash, e.g., "/folder/file.txt"
        file.customPath = item.fullPath.startsWith('/') ? item.fullPath.substring(1) : item.fullPath;
        resolve([file]);
      });
    });
  } else if (item.isDirectory) {
    const dirReader = item.createReader();
    return new Promise(resolve => {
      dirReader.readEntries(async entries => {
        let files = [];
        for (const entry of entries) {
          const subFiles = await scanFiles(entry);
          files = files.concat(subFiles);
        }
        resolve(files);
      });
    });
  }
  return [];
};

const UploadZone = ({ onFilesStaged, isUploading }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.items) {
      let allFiles = [];
      const items = Array.from(e.dataTransfer.items);
      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            const files = await scanFiles(entry);
            allFiles = allFiles.concat(files);
          }
        }
      }
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      const validFiles = allFiles.filter(f => f.size <= MAX_SIZE);
      
      if (validFiles.length < allFiles.length) {
        alert("Some files were ignored because they exceed the 50MB browser limit.");
      }
      
      if (validFiles.length > 0) {
        onFilesStaged(validFiles);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const MAX_SIZE = 50 * 1024 * 1024;
      const validFiles = files.filter(f => f.size <= MAX_SIZE);
      if (validFiles.length < files.length) alert("Some files exceed the 50MB limit.");
      if (validFiles.length > 0) onFilesStaged(validFiles);
    }
    e.dataTransfer.clearData();
  }, [onFilesStaged]);

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const MAX_SIZE = 50 * 1024 * 1024;
      
      const validFiles = files.filter(f => {
        if (f.webkitRelativePath) f.customPath = f.webkitRelativePath;
        return f.size <= MAX_SIZE;
      });
      
      if (validFiles.length < files.length) alert("Some files exceed the 50MB limit.");
      if (validFiles.length > 0) onFilesStaged(validFiles);
      e.target.value = null; // Reset
    }
  }, [onFilesStaged]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="upload-container glass-panel"
    >
      <div 
        className={`drop-zone ${isDragActive ? 'drag-active' : ''} ${isUploading ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-upload" 
          className="file-input" 
          onChange={handleFileInput}
          disabled={isUploading}
          multiple
          // To allow folder selection on click:
          // webkitdirectory="true"
        />
        <label htmlFor="file-upload" className="drop-zone-content">
          <div className="status-indicator default">
            <UploadCloud size={48} className="upload-icon" />
            <p>Drag & Drop files or folders here</p>
            <span>or click to browse</span>
          </div>
        </label>
        
        <div style={{ marginTop: '1.5rem', zIndex: 10, position: 'relative' }}>
          <input 
            type="file" 
            id="camera-upload" 
            className="file-input" 
            accept="image/*,video/*"
            onChange={handleFileInput}
            disabled={isUploading}
            multiple
          />
          <label htmlFor="camera-upload" className="action-button" style={{ display: 'inline-flex', padding: '0.6rem 1.2rem', fontSize: '0.9rem', cursor: 'pointer', background: 'var(--primary)' }}>
            <Camera size={18} style={{ marginRight: '0.5rem' }} /> Tap to upload from camera roll
          </label>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadZone;
