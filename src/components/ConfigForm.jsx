import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Loader, Edit2, ExternalLink, CheckCircle, Save, Bookmark } from 'lucide-react';
import { fetchUserRepos, fetchRepoBranches, fetchUserProfile } from '../utils/github';

const ConfigForm = ({ config, setConfig, isVisible, toggleVisibility, onClearData }) => {
  const [showToken, setShowToken] = useState(false);
  const [repos, setRepos] = useState([]);
  const [branches, setBranches] = useState([]);
  
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  const [userProfile, setUserProfile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // New state for presets UI
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  // 1. Verify token and fetch profile when token changes
  useEffect(() => {
    if (!config.token) {
      setUserProfile(null);
      setRepos([]);
      return;
    }

    const verifyToken = async () => {
      setIsVerifying(true);
      setErrorText('');
      try {
        const profile = await fetchUserProfile(config.token);
        setUserProfile(profile);
        
        // After verifying, load repos
        setLoadingRepos(true);
        const repoData = await fetchUserRepos(config.token);
        setRepos(repoData);
        if (repoData.length === 0) setManualMode(true);
      } catch (err) {
        console.error(err);
        setErrorText(err.message || 'Token verification failed.');
        setUserProfile(null);
      } finally {
        setIsVerifying(false);
        setLoadingRepos(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      verifyToken();
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [config.token]);

  // 2. Fetch branches when owner/repo available
  useEffect(() => {
    if (!config.token || !config.owner || !config.repo) {
      setBranches([]);
      return;
    }

    const loadBranches = async () => {
      setLoadingBranches(true);
      try {
        const branchData = await fetchRepoBranches(config.token, config.owner, config.repo);
        setBranches(branchData);
      } catch (err) {
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      loadBranches();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [config.token, config.owner, config.repo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleRepoSelect = (e) => {
    const repoFullName = e.target.value;
    if (!repoFullName) return;
    
    const selected = repos.find(r => r.full_name === repoFullName);
    if (selected) {
      setConfig(prev => ({
        ...prev,
        owner: selected.owner.login,
        repo: selected.name,
        branch: selected.default_branch || prev.branch
      }));
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim() || !config.owner || !config.repo) return;
    
    const newPreset = {
      id: Date.now(),
      name: presetName.trim(),
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      path: config.path
    };

    setConfig(prev => ({
      ...prev,
      presets: [...(prev.presets || []), newPreset]
    }));
    
    setPresetName('');
    setShowPresetInput(false);
  };

  const handleLoadPreset = (preset) => {
    setConfig(prev => ({
      ...prev,
      owner: preset.owner,
      repo: preset.repo,
      branch: preset.branch,
      path: preset.path
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="config-panel glass-panel fade-in">
      <div className="panel-header">
        <h2><Settings size={20} /> Settings & Setup</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="icon-button small" 
            onClick={onClearData} 
            title="Clear all local data and credentials"
            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            Clear Data
          </button>
          <button 
            className={`icon-button small ${manualMode ? 'active' : ''}`} 
            onClick={() => setManualMode(!manualMode)} 
            title="Toggle Manual Input"
          >
            <Edit2 size={16} />
          </button>
          <button className="icon-button" onClick={toggleVisibility} title="Close Settings">
            &times;
          </button>
        </div>
      </div>

      {errorText && <div className="alert-message error" style={{ fontSize: '0.85rem', marginBottom: '1rem', padding: '0.5rem' }}>{errorText}</div>}
      
      {/* 3-STEP TOKEN WIZARD */}
      <div className="wizard-container" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Authentication Wizard
        </h3>
        
        <div className="wizard-step" style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Step 1: Get your secure token</div>
          <a 
            href="https://github.com/settings/tokens/new?scopes=repo&description=GitDrop+Uploader" 
            target="_blank" 
            rel="noreferrer"
            className="action-button"
            style={{ display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            Generate Token on GitHub <ExternalLink size={14} style={{ marginLeft: '0.4rem' }} />
          </a>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            (The link pre-selects the required permissions automatically)
          </div>
        </div>

        <div className="wizard-step" style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Step 2: Paste your token here</div>
          <div className="input-with-icon">
            <input
              type={showToken ? 'text' : 'password'}
              name="token"
              value={config.token}
              onChange={handleChange}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              style={{ paddingRight: '2.5rem' }}
            />
            <button 
              type="button" 
              className="inside-input-button"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="wizard-step">
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Step 3: Verification</div>
          {isVerifying ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <Loader size={16} className="spinner" /> Verifying token...
            </div>
          ) : userProfile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.9rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
              <img src={userProfile.avatar_url} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <CheckCircle size={16} /> Connected as <strong>@{userProfile.login}</strong>
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Awaiting token input...</div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <input 
            type="checkbox" 
            name="rememberMe" 
            id="rememberMe"
            checked={config.rememberMe || false} 
            onChange={(e) => setConfig(prev => ({ ...prev, rememberMe: e.target.checked }))} 
            style={{ width: 'auto' }}
          />
          <label htmlFor="rememberMe" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Remember me (store securely to skip this next time)</label>
        </div>
      </div>

      {userProfile && (
        <>
          {/* UPLOAD TEMPLATES (PRESETS) */}
          {(config.presets && config.presets.length > 0) && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label><Bookmark size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Saved Templates</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {config.presets.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleLoadPreset(p)}
                    className="action-button"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!manualMode && repos.length > 0 ? (
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Select Project</span>
                {loadingRepos && <Loader className="spinner" size={14} />}
              </label>
              <select 
                value={`${config.owner}/${config.repo}`} 
                onChange={handleRepoSelect}
                className="custom-select"
              >
                <option value="/">-- Choose a Project --</option>
                {repos.map(r => (
                  <option key={r.id} value={r.full_name}>
                    {r.name} {r.private ? '(Private)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {(manualMode || repos.length === 0) && (
            <div className="form-row">
              <div className="form-group">
                <label>Project Owner (Username)</label>
                <input
                  type="text"
                  name="owner"
                  value={config.owner}
                  onChange={handleChange}
                  placeholder="e.g., octocat"
                />
              </div>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  name="repo"
                  value={config.repo}
                  onChange={handleChange}
                  placeholder="e.g., my-website"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Version (Branch)</span>
                {loadingBranches && <Loader className="spinner" size={14} />}
              </label>
              {!manualMode && branches.length > 0 ? (
                <select
                  value={config.branch}
                  onChange={(e) => setConfig(prev => ({ ...prev, branch: e.target.value }))}
                  className="custom-select"
                >
                  <option value="">-- Choose a Version --</option>
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="branch"
                  value={config.branch}
                  onChange={handleChange}
                  placeholder="e.g. main"
                />
              )}
            </div>
            <div className="form-group">
              <label>Target Folder (Optional)</label>
              <input
                type="text"
                name="path"
                value={config.path}
                onChange={handleChange}
                placeholder="e.g. assets/images/"
              />
            </div>
          </div>

          {/* TEMPLATE SAVE BUTTON */}
          {config.owner && config.repo && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {!showPresetInput ? (
                <button 
                  className="icon-button small" 
                  style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--primary)' }}
                  onClick={() => setShowPresetInput(true)}
                >
                  <Save size={14} style={{ marginRight: '0.3rem' }} /> Save as Template
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <input 
                    type="text" 
                    placeholder="Template Name (e.g. Blog Images)" 
                    value={presetName}
                    onChange={e => setPresetName(e.target.value)}
                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                  />
                  <button className="action-button" onClick={handleSavePreset} style={{ padding: '0 1rem' }}>Save</button>
                  <button className="icon-button" onClick={() => setShowPresetInput(false)}>&times;</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConfigForm;
