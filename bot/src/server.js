require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('octokit');

const app = express();
const PORT = process.env.BOT_PORT || 3001;

// --- Middleware ---
app.use(cors()); // Allow requests from the frontend
app.use(express.json());

// --- GitHub Push Logic ---
/**
 * Commits and pushes a file change to a GitHub repository using a PAT.
 * @param {string} repo The repository in 'owner/repo' format.
 * @param {string} filePath The full path to the file within the repository.
 * @param {string} content The new content of the file.
 * @param {string} message The commit message.
 * @param {string} token The GitHub Personal Access Token.
 * @returns {Promise<string>} The URL of the new commit.
 */
async function pushCodeToRepo(repo, filePath, content, message, token) {
  try {
    const octokit = new Octokit({ auth: token });
    const [owner, repoName] = repo.split('/');

    if (!owner || !repoName) {
      throw new Error("Invalid repository format. Expected 'owner/repo'.");
    }
    
    let currentSha;
    try {
      const { data: file } = await octokit.rest.repos.getContent({
        owner,
        repo: repoName,
        path: filePath,
      });
      if (Array.isArray(file) || file.type !== 'file') {
          throw new Error(`Path '${filePath}' is not a file.`);
      }
      currentSha = file.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    const { data: commitData } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: filePath,
      message,
      content: Buffer.from(content).toString('base64'),
      sha: currentSha,
    });

    console.log(`Push successful to ${repo}/${filePath}. Commit: ${commitData.commit.html_url}`);
    return commitData.commit.html_url;

  } catch (err) {
    console.error(`GitHub push error for repo ${repo}: ${err.message}`);
    if (err.status === 401 || err.status === 403) {
        throw new Error("Authentication failed. Your GitHub PAT is likely invalid or missing the 'repo' scope for write access.");
    }
    if (err.status === 404) {
        throw new Error(`Repository or file not found. Please check the path and your PAT's access permissions.`);
    }
    if (err.status === 422) {
        throw new Error(`Commit failed. The file may have been updated by someone else, or the file path is incorrect.`);
    }
    throw err;
  }
}

// --- Email Service Setup ---
let transporter;
let emailServiceMode = 'simulation';

// Check if environment variables for a real email service are configured
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Use a real SMTP transport if configured
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    emailServiceMode = 'live';
    console.log('📧 Email service configured with SMTP transport (Live Mode).');
} else {
    // Fallback to JSON transport for simulation if not configured
    transporter = nodemailer.createTransport({
        jsonTransport: true
    });
    console.log('\n⚠️  Email service running in SIMULATION mode. No real emails will be sent.');
    console.log('   To enable live emails, create a `.env` file in the `/bot` directory with your SMTP provider\'s details:');
    console.log('   ---------------------------------');
    console.log('   EMAIL_HOST="smtp.example.com"');
    console.log('   EMAIL_PORT="587"');
    console.log('   EMAIL_USER="your-smtp-username"');
    console.log('   EMAIL_PASS="your-smtp-password"');
    console.log('   ---------------------------------\n');
}

/**
 * @api {get} /api/status Get Bot Server Status
 * @apiName GetStatus
 * @apiGroup Status
 *
 * @apiSuccess {String} emailService The current mode of the email service ('live' or 'simulation').
 */
app.get('/api/status', (req, res) => {
    res.status(200).json({ emailService: emailServiceMode });
});

/**
 * @api {post} /api/send-test-email Send a Test Email
 * @apiName SendTestEmail
 * @apiGroup Notifications
 *
 * @apiParam {String} email The email address to send a test notification to.
 *
 * @apiSuccess {String} message Confirmation message.
 * @apiError {String} error Error message if sending fails.
 */
app.post('/api/send-test-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email address is required.' });
    }

    const mailOptions = {
        from: '"Sentinel AI" <noreply@sentinel.example.com>',
        to: email,
        subject: '✅ Test Notification from Sentinel AI',
        text: 'This is a test notification to confirm your email settings are configured correctly.',
        html: '<b>This is a test notification to confirm your email settings are configured correctly.</b>',
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        
        if (emailServiceMode === 'simulation') {
            console.log('Email simulation successful. Data:', info.message);
            res.status(200).json({ message: `(Simulation) Test notification logged for ${email}` });
        } else {
            console.log('Live email sent. Response:', info.response);
            res.status(200).json({ message: `Test email successfully sent to ${email}` });
        }
        
    } catch (error) {
        console.error('Failed to send test email:', error);
        res.status(500).json({ error: 'Failed to send test email. Check server logs.' });
    }
});

/**
 * @api {post} /api/push-code Push code change to GitHub
 * @apiName PushCode
 * @apiGroup GitOps
 *
 * @apiParam {String} repo Repository in 'owner/repo' format.
 * @apiParam {String} filePath Path to the file.
 * @apiParam {String} content New file content.
 * @apiParam {String} message Commit message.
 * @apiParam {String} token GitHub PAT.
 *
 * @apiSuccess {Boolean} success True if successful.
 * @apiSuccess {String} commitUrl URL of the new commit.
 * @apiError {String} error Error message.
 */
app.post('/api/push-code', async (req, res) => {
    const { repo, filePath, content, message, token } = req.body;
    if (!repo || !filePath || !content || !message || !token) {
        return res.status(400).json({ error: 'Missing required parameters: repo, filePath, content, message, token.' });
    }
    try {
        const commitUrl = await pushCodeToRepo(repo, filePath, content, message, token);
        res.json({ success: true, commitUrl });
    } catch (err) {
        res.status(500).json({ error: `Push failed: ${err.message}` });
    }
});


/**
 * @api {get} /api/docs/content Get API Documentation
 * @apiName GetApiDocs
 * @apiGroup Documentation
 *
 * @apiSuccess {String} content The Markdown content of the API documentation.
 * @apiError {String} error Error message if the documentation file cannot be read.
 */
app.get('/api/docs/content', (req, res) => {
    const docsPath = path.join(__dirname, '..', '..', 'docs', 'bot-api.md');
    fs.readFile(docsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading documentation file:', err);
            return res.status(500).json({ error: 'Could not load documentation. Please run `npm run docs:generate` in the bot directory.' });
        }
        res.status(200).json({ content: data });
    });
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`✅ Sentinel Bot server listening on http://localhost:${PORT}`);
});