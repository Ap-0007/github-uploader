/**
 * Converts a File object to a Base64 encoded string.
 * We need to remove the Data URL prefix (e.g., "data:image/png;base64,") before sending to GitHub.
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
      if ((encoded.length % 4) > 0) {
        encoded += '='.repeat(4 - (encoded.length % 4));
      }
      resolve(encoded);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Uploads a file to a GitHub repository.
 * 
 * @param {Object} config The configuration object.
 * @param {string} config.token GitHub Personal Access Token
 * @param {string} config.owner Repository owner (username or org)
 * @param {string} config.repo Repository name
 * @param {string} config.branch Branch name (e.g., 'main')
 * @param {string} config.path Target path in the repo (e.g., 'uploads')
 * @param {File} file The file to upload
 * @param {string} commitMessage Optional custom commit message
 */
export const uploadFileToGitHub = async ({ token, owner, repo, branch, path }, file, commitMessage = '') => {
  if (!token || !owner || !repo || !file) {
    throw new Error('Missing required upload parameters.');
  }

  // Ensure path doesn't start with a slash and ends with a slash if it's a directory
  let folderPath = path.trim();
  if (folderPath.startsWith('/')) folderPath = folderPath.substring(1);
  if (folderPath !== '' && !folderPath.endsWith('/')) folderPath += '/';

  const filenameToUse = file.customPath || file.name;
  const fullFilePath = `${folderPath}${filenameToUse}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fullFilePath}`;
  
  let existingSha = null;

  // 1. Check if file exists to get its SHA (required for overwrite)
  try {
    const getUrl = branch ? `${url}?ref=${branch}` : url;
    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      existingSha = data.sha;
    }
  } catch (err) {
    // Ignore error, file probably doesn't exist
  }

  // 2. Upload the file
  const base64Content = await fileToBase64(file);
  const message = commitMessage.trim() !== '' ? commitMessage : `Upload ${file.name}`;

  const requestBody = {
    message,
    content: base64Content,
  };

  if (branch) requestBody.branch = branch;
  if (existingSha) requestBody.sha = existingSha;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Your token is invalid or expired. Here's how to get a new one.");
    if (response.status === 403) throw new Error("You don't have write access to this project.");
    if (response.status === 404) throw new Error("Project or Version not found. Double check your settings.");
    if (response.status === 422) throw new Error("A file with this name already exists or the data was malformed.");
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed with status ${response.status}`);
  }

  return response.json();
};

/**
 * Fetches the authenticated user's repositories.
 */
export const fetchUserRepos = async (token) => {
  if (!token) throw new Error('GitHub token is required to fetch repositories');
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch repositories');
  }
  return response.json();
};

/**
 * Fetches branches for a specific repository.
 */
export const fetchRepoBranches = async (token, owner, repo) => {
  if (!token || !owner || !repo) throw new Error('Token, owner, and repo are required to fetch branches');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch branches');
  }
  return response.json();
};

/**
 * Fetches the authenticated user's profile to verify token.
 */
export const fetchUserProfile = async (token) => {
  if (!token) throw new Error('GitHub token is required');
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your token is invalid or expired.");
    throw new Error('Failed to verify token');
  }
  return response.json();
};
