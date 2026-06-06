import React, { useState, useEffect } from 'react';
import ConfigForm from './components/ConfigForm';
import UploadZone from './components/UploadZone';
import StagedFilesList from './components/StagedFilesList';
import Scratchpad from './components/Scratchpad';
import { uploadFileToGitHub } from './utils/github';
import { GitBranch, Settings, History, ExternalLink, Trash2, Copy, Check, FileImage, FileCode, FileText, FileArchive, File as FileIcon, Sun, Moon, Edit3, X, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return <FileImage size={20} />;
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'md'].includes(ext)) return <FileCode size={20} />;
  if (['txt', 'csv', 'log', 'pdf'].includes(ext)) return <FileText size={20} />;
  if (['zip', 'tar', 'gz', 'rar'].includes(ext)) return <FileArchive size={20} />;
  return <FileIcon size={20} />;
};

const App = () => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('ghUploaderConfig') || sessionStorage.getItem('ghUploaderConfig');
    return saved ? JSON.parse(saved) : {
      token: '', owner: '', repo: '', branch: '', path: '', rememberMe: false
    };
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('ghUploaderHistory') || sessionStorage.getItem('ghUploaderHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [stagedFiles, setStagedFiles] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('ghUploaderTheme') || 'dark');
  
  // UI Toggles
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  
  const [commitMessage, setCommitMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  
  // NEW: Activity Log State
  const [activityLog, setActivityLog] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const logActivity = (operation, filename, extra = '') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLog(prev => [{
      id: Date.now() + Math.random(),
      timestamp,
      operation,
      filename,
      extra
    }, ...prev]);
  };

  useEffect(() => {
    if (config.rememberMe) {
      localStorage.setItem('ghUploaderConfig', JSON.stringify(config));
      sessionStorage.removeItem('ghUploaderConfig');
    } else {
      sessionStorage.setItem('ghUploaderConfig', JSON.stringify(config));
      localStorage.removeItem('ghUploaderConfig');
    }
  }, [config]);

  useEffect(() => {
    if (config.rememberMe) {
      localStorage.setItem('ghUploaderHistory', JSON.stringify(history));
      sessionStorage.removeItem('ghUploaderHistory');
    } else {
      sessionStorage.setItem('ghUploaderHistory', JSON.stringify(history));
      localStorage.removeItem('ghUploaderHistory');
    }
  }, [history, config.rememberMe]);

  const handleClearData = () => {
    localStorage.removeItem('ghUploaderConfig');
    sessionStorage.removeItem('ghUploaderConfig');
    localStorage.removeItem('ghUploaderHistory');
    sessionStorage.removeItem('ghUploaderHistory');
    setConfig({ token: '', owner: '', repo: '', branch: '', path: '', rememberMe: false });
    setHistory([]);
    setStagedFiles([]);
    logActivity('System', 'Cleared all local data and credentials');
    setErrorMessage('All local data securely wiped.');
    setShowConfig(false);
    setTimeout(() => setErrorMessage(''), 4000);
  };

  useEffect(() => {
    localStorage.setItem('ghUploaderTheme', theme);
    document.documentElement.className = theme === 'light' ? 'light-theme' : '';
  }, [theme]);

  useEffect(() => {
    if (!config.token || !config.owner || !config.repo) setShowConfig(true);
  }, []);

  const handleFilesStaged = (files) => {
    const newStaged = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      status: 'staged'
    }));
    setStagedFiles(prev => [...prev, ...newStaged]);
    setSuccessDetails(null);
    setErrorMessage('');
    logActivity('Staged', `${files.length} file(s) added to queue`);
  };

  const handleRemoveStagedFile = (id) => {
    const file = stagedFiles.find(f => f.id === id);
    if (file) logActivity('Removed', file.file.name, 'from queue');
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearStagedFiles = () => {
    logActivity('Cleared', 'Entire staging queue');
    setStagedFiles([]);
  };

  const handleUpload = async () => {
    if (!config.token || !config.owner || !config.repo) {
      setErrorMessage('Please configure GitHub Token, Owner, and Repo in settings first.');
      setShowConfig(true);
      return;
    }

    const filesToUpload = stagedFiles.filter(f => f.status === 'staged' || f.status === 'error');
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');
    setSuccessDetails(null);

    const newHistoryItems = [];
    let successCount = 0;

    const updateFileStatus = (id, status) => {
      setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    };

    try {
      for (const staged of filesToUpload) {
        updateFileStatus(staged.id, 'uploading');
        
        try {
          const response = await uploadFileToGitHub(config, staged.file, commitMessage);
          updateFileStatus(staged.id, 'success');
          successCount++;
          
          newHistoryItems.push({
            id: Date.now() + Math.random(),
            name: staged.file.name,
            url: response.content.html_url,
            date: new Date().toISOString()
          });

          logActivity('Uploaded', staged.file.name, `${config.owner}/${config.repo}`);
        } catch (err) {
          updateFileStatus(staged.id, 'error');
          logActivity('Error', staged.file.name, err.message);
          throw err;
        }
      }
      
      setHistory(prev => [...newHistoryItems, ...prev].slice(0, 10)); // Keep last 10
      setCommitMessage('');
      
      // Post-Upload Receipt (Prompt 6)
      const folderName = config.path ? config.path : 'the root folder';
      const repoUrl = `https://github.com/${config.owner}/${config.repo}/tree/${config.branch}/${config.path}`;
      setSuccessDetails({
        count: successCount,
        folder: folderName,
        project: config.repo,
        url: repoUrl
      });

      setStagedFiles(prev => prev.filter(f => f.status !== 'success'));

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#ffffff']
      });
    } catch (err) {
      setErrorMessage(err.message || 'An unknown error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyLogToClipboard = () => {
    const textLog = activityLog.map(entry => `[${entry.timestamp}] ${entry.operation}: ${entry.filename} ${entry.extra ? `(${entry.extra})` : ''}`).join('\n');
    navigator.clipboard.writeText(textLog);
    setCopiedId('log');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="app-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}
        className="app-header glass-panel"
      >
        <div className="logo">
          <GitBranch size={28} />
          <h1>GitDrop</h1>
        </div>
        <div className="header-actions">
          <button 
            className="icon-button" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className={`icon-button ${showActivityLog ? 'active' : ''}`} 
            onClick={() => setShowActivityLog(true)} 
            title="Activity Log"
          >
            <Activity size={20} />
          </button>
          <button 
            className={`icon-button ${showScratchpad ? 'active' : ''}`} 
            onClick={() => setShowScratchpad(!showScratchpad)} 
            title="Scratchpad Editor"
          >
            <Edit3 size={20} />
          </button>
          <button 
            className={`icon-button ${showConfig ? 'active' : ''}`} 
            onClick={() => setShowConfig(!showConfig)} 
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </motion.header>

      {/* Activity Log Drawer */}
      <AnimatePresence>
        {showActivityLog && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '400px', height: '100vh',
              background: 'var(--panel-bg)', backdropFilter: 'blur(16px)', borderLeft: '1px solid var(--border)',
              zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.2)'
            }}
          >
            <div className="panel-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={20} /> Activity Log</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-button small" onClick={copyLogToClipboard} title="Copy Log">
                  {copiedId === 'log' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </button>
                <button className="icon-button" onClick={() => setShowActivityLog(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {activityLog.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No activity yet.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activityLog.map(entry => (
                    <li key={entry.id} style={{ fontSize: '0.85rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                        {entry.operation} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'normal', float: 'right' }}>{entry.timestamp}</span>
                      </div>
                      <div style={{ wordBreak: 'break-all' }}>{entry.filename}</div>
                      {entry.extra && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{entry.extra}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="app-main">
        <ConfigForm 
          config={config} 
          setConfig={setConfig} 
          isVisible={showConfig} 
          toggleVisibility={() => setShowConfig(false)} 
          onClearData={handleClearData}
        />
        
        <AnimatePresence>
          {showScratchpad && (
            <Scratchpad 
              onStageFile={handleFilesStaged} 
              onClose={() => setShowScratchpad(false)} 
            />
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hero-text"
        >
          <h2>Seamlessly upload files to GitHub</h2>
          <p>Drop files below, preview them, and instantly commit them to your repository.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="upload-section"
        >
          <div className="form-group commit-input">
            <input 
              type="text" 
              placeholder="Describe your change (e.g. Added new logo files)" 
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              disabled={isUploading}
            />
          </div>
          
          <UploadZone onFilesStaged={handleFilesStaged} isUploading={isUploading} />

          <StagedFilesList 
            stagedFiles={stagedFiles} 
            onRemoveFile={handleRemoveStagedFile} 
            onClear={handleClearStagedFiles} 
            onUpload={handleUpload}
            isUploading={isUploading}
          />
        </motion.div>

        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="alert-message error"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* PROMPT 6: Human readable post-upload receipt */}
          {successDetails && !errorMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="alert-message success"
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}
            >
              <div>
                You added <strong>{successDetails.count}</strong> file(s) to the <strong>'{successDetails.folder}'</strong> folder in your <strong>'{successDetails.project}'</strong> project. 
                Your change is live.
              </div>
              <a 
                href={successDetails.url} 
                target="_blank" 
                rel="noreferrer" 
                className="action-button" 
                style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--text)', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                View on GitHub <ExternalLink size={14} style={{ marginLeft: '0.4rem' }} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>Your token is safely stored locally in your browser and never sent anywhere else.</p>
      </motion.footer>
    </div>
  );
};

export default App;
