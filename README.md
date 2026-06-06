# 🚀 GitDrop

**GitDrop** is a premium, client-side Progressive Web Application (PWA) that allows you to seamlessly upload files and folders directly to your GitHub repositories from your browser—no backend required! 

Built with React, Vite, and Framer Motion, it offers a buttery-smooth, glassmorphic interface that makes managing your GitHub assets feel incredibly fast and secure.

---

## ✨ Features

- **🔒 100% Client-Side Security**: Your GitHub Personal Access Token (PAT) is never sent to a backend server. It is stored securely in your browser's local or session storage and communicates directly with the GitHub API.
- **📁 Folder Drag & Drop**: Drag entire folders into the browser! GitDrop recursively reads directories and preserves your folder structures during the upload.
- **📝 Markdown Scratchpad**: Need to write a quick `README.md` or code snippet? Use the built-in Scratchpad with live Markdown preview (protected by `rehype-sanitize` against XSS).
- **🎨 Premium Aesthetics**: A gorgeous dark/light mode UI featuring glassmorphism, floating micro-animations, and celebratory confetti upon successful uploads.
- **⚡ Dynamic Repositories**: Automatically fetches and lists your available repositories and branches using your secure token.
- **📱 PWA Ready**: Install GitDrop directly onto your desktop or mobile device as a native app for instant access.
- **🛡️ Built-in Protections**: Includes a 50MB file size limit to prevent memory crashes and a "Panic Wipe" button to instantly destroy all local credentials on shared computers.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Vanilla CSS (Glassmorphism & CSS Variables)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Markdown**: React-Markdown + Rehype-Sanitize
- **API**: GitHub REST API (Octokit alternative via native `fetch`)

---

## 🚀 Getting Started (For Developers)

If you downloaded the source code and want to run it locally or modify it:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Open your terminal in the project directory.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open the provided `localhost` URL in your browser!

### Building for Production
To create a highly optimized production bundle:
```bash
npm run build
```
The compiled, ready-to-host files will be generated in the `dist/` directory.

---

## 🔑 Generating a GitHub Token

To use GitDrop, you will need a GitHub Personal Access Token (Classic).
1. Go to your [GitHub Developer Settings](https://github.com/settings/tokens).
2. Click **Generate new token (classic)**.
3. Give it a name (e.g., "GitDrop App") and select an expiration date.
4. Under Scopes, select the **`repo`** checkbox (this grants read/write access to your code).
5. Generate the token and paste it into the GitDrop configuration panel!

---

## 🤝 Contributing
Feel free to fork this project, submit pull requests, or open issues to suggest new features!

**Created with ❤️ by you!**
