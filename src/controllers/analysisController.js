const { analyzeCode } = require('../services/analysisService');
const { explainCodeSnippet, explainCodeSimply, refactorCode } = require('../services/aiService');

/**
 * Analyzes code and returns a quality score and suggestions.
 */
const analyze = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const user = req.user;

    if (!user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const result = await analyzeCode({ user, code, language });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Provides a detailed AI explanation of the code.
 */
const explain = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const user = req.user;

    if (!user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const explanation = await explainCodeSnippet(code, language);
    res.status(200).json({ explanation });
  } catch (error) {
    next(error);
  }
};

/**
 * Provides a simplified AI explanation for beginners.
 */
const explainSimply = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const user = req.user;

    if (!user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const explanation = await explainCodeSimply(code, language);
    res.status(200).json({ explanation });
  } catch (error) {
    next(error);
  }
};

/**
 * Refactors the code using AI to follow best practices.
 */
const refactor = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const user = req.user;

    if (!user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const refactoredCode = await refactorCode(code, language);
    res.status(200).json({ refactoredCode });
  } catch (error) {
    next(error);
  }
};

const axios = require('axios');

/**
 * Fetches and analyzes a public GitHub repository main file.
 */
const analyzeGithub = async (req, res, next) => {
  try {
    const { repoUrl } = req.body;
    const user = req.user;

    if (!user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    // Extract owner and repo from URL (e.g., https://github.com/owner/repo)
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      const error = new Error('Invalid GitHub URL. Use format: https://github.com/owner/repo');
      error.statusCode = 400;
      throw error;
    }

    const [_, owner, repo] = match;
    
    // 1. Get repo default branch
    const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const defaultBranch = repoInfo.data.default_branch;

    // 2. Get tree to find a main file
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeRes = await axios.get(treeUrl);
    
    // Identify a 'main' file (priority: index.js, app.py, main.py, Main.java, README.md)
    const files = treeRes.data.tree;
    const mainFile = files.find(f => /^(index\.js|app\.py|main\.py|Main\.java|src\/index\.js|src\/App\.jsx)$/i.test(f.path)) 
                  || files.find(f => f.path.toLowerCase().endsWith('.js') || f.path.toLowerCase().endsWith('.py'))
                  || files.find(f => f.path === 'README.md');

    if (!mainFile) {
      throw new Error('Could not find a suitable main code file to analyze in this repository.');
    }

    // 3. Fetch content
    const contentRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${mainFile.path}`);
    const code = contentRes.data;
    const language = mainFile.path.endsWith('.py') ? 'Python' : mainFile.path.endsWith('.java') ? 'Java' : 'JavaScript';

    // 4. Analyze
    const result = await analyzeCode({ user, code, language });
    
    res.status(200).json({ 
      ...result, 
      repoName: repo, 
      fileName: mainFile.path, 
      refCode: code, 
      refLanguage: language.toLowerCase() 
    });
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    res.status(error.response?.status || 500).json({ message: `GitHub Error: ${msg}` });
  }
};

module.exports = {
  analyze,
  explain,
  explainSimply,
  refactor,
  analyzeGithub,
};
