import React, { useEffect, useState } from 'react';
import { Trash2, FileImage, FileCode, FileText, FileArchive, File as FileIcon, Play, CheckCircle, AlertCircle, Loader, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (filename, fileType) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (fileType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <FileImage size={24} />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'md'].includes(ext)) {
    return <FileCode size={24} />;
  }
  if (['txt', 'csv', 'log', 'pdf'].includes(ext)) {
    return <FileText size={24} />;
  }
  if (['zip', 'tar', 'gz', 'rar'].includes(ext)) {
    return <FileArchive size={24} />;
  }
  return <FileIcon size={24} />;
};

const StagedFileRow = ({ stagedFile, onRemove }) => {
  const { id, file, status } = stagedFile;
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (file.type && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <motion.li 
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`staged-item status-${status}`}
    >
      <div className="staged-item-left">
        <div className="staged-item-preview">
          {imagePreview ? (
            <img src={imagePreview} alt={file.name} className="staged-thumbnail" />
          ) : (
            <div className="staged-icon-wrapper">
              {getFileIcon(file.name, file.type || '')}
            </div>
          )}
        </div>
        <div className="staged-item-info">
          <span className="staged-name" title={file.customPath || file.name}>
            {file.customPath || file.name}
          </span>
          <span className="staged-size">{formatSize(file.size)}</span>
        </div>
      </div>

      <div className="staged-item-right">
        {status === 'staged' && (
          <button className="icon-button small delete" onClick={() => onRemove(id)} title="Remove file">
            <X size={14} />
          </button>
        )}
        {status === 'uploading' && (
          <div className="status-container uploading">
            <Loader className="spinner" size={16} />
            <span className="status-label">Uploading</span>
          </div>
        )}
        {status === 'success' && (
          <div className="status-container success">
            <CheckCircle size={16} color="#10b981" />
            <span className="status-label">Uploaded</span>
          </div>
        )}
        {status === 'error' && (
          <div className="status-container error">
            <AlertCircle size={16} color="#ef4444" />
            <span className="status-label">Failed</span>
          </div>
        )}
      </div>

      {status === 'uploading' && (
        <div className="progress-bar-container">
          <div className="progress-bar-indicator"></div>
        </div>
      )}
    </motion.li>
  );
};

const StagedFilesList = ({ stagedFiles, onRemoveFile, onClear, onUpload, isUploading }) => {
  if (stagedFiles.length === 0) return null;

  const filesCount = stagedFiles.length;
  const pendingCount = stagedFiles.filter(f => f.status === 'staged' || f.status === 'error').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="staged-files-panel glass-panel"
    >
      <div className="panel-header">
        <h2>Files Staged ({filesCount})</h2>
        <button 
          className="icon-button small" 
          onClick={onClear} 
          disabled={isUploading} 
          title="Clear all staged files"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <motion.ul layout className="staged-files-list">
        <AnimatePresence mode="popLayout">
          {stagedFiles.map(stagedFile => (
            <StagedFileRow 
              key={stagedFile.id} 
              stagedFile={stagedFile} 
              onRemove={onRemoveFile} 
            />
          ))}
        </AnimatePresence>
      </motion.ul>

      <AnimatePresence>
        {pendingCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="staged-actions"
          >
            <button 
              className="action-button upload-button" 
              onClick={onUpload} 
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader className="spinner" size={18} />
                  Uploading...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Upload {pendingCount} File{pendingCount > 1 ? 's' : ''} to GitHub
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StagedFilesList;
