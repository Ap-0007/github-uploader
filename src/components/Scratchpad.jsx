import React, { useState } from 'react';
import { FileCode, Plus, X, Edit2, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { motion } from 'framer-motion';

const Scratchpad = ({ onStageFile, onClose }) => {
  const [filename, setFilename] = useState('notes.md');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'

  const handleStage = (e) => {
    e.preventDefault();
    if (!filename.trim()) return;
    
    // Create a client-side File object from the scratchpad content
    const file = new File([content], filename.trim(), { type: 'text/markdown;charset=utf-8' });
    onStageFile([file]);
    
    // Reset scratchpad content
    setContent('');
    setFilename('notes.md');
    if (onClose) onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="scratchpad-panel glass-panel"
      style={{ marginBottom: '2rem' }}
    >
      <div className="panel-header">
        <h2><FileCode size={20} /> Scratchpad Editor</h2>
        <button className="icon-button" onClick={onClose} title="Close Scratchpad">
          <X size={16} />
        </button>
      </div>
      
      <form onSubmit={handleStage} className="scratchpad-form">
        <div className="form-group">
          <label>File Name</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="e.g. notes.md, test.js"
            required
          />
        </div>
        
        <div className="form-group">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
              onClick={() => setActiveTab('write')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: activeTab === 'write' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Edit2 size={16} /> Write
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: activeTab === 'preview' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Eye size={16} /> Preview
            </button>
          </div>

          {activeTab === 'write' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your markdown or code here..."
              rows={10}
              className="scratchpad-textarea"
            />
          ) : (
            <div className="scratchpad-preview glass-panel" style={{ minHeight: '200px', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)' }}>
              {content ? (
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
              ) : (
                <em style={{ color: 'var(--text-muted)' }}>Nothing to preview...</em>
              )}
            </div>
          )}
        </div>

        <button type="submit" className="action-button stage-button">
          <Plus size={18} /> Stage Scratchpad File
        </button>
      </form>
    </motion.div>
  );
};

export default Scratchpad;
