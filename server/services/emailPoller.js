/**
 * Email IMAP poller — runs as a background service inside the Express server.
 * Polls configured IMAP accounts every 5 minutes. For each unseen email with
 * a resume attachment (.pdf/.doc/.docx), it parses the resume and creates a
 * candidate record automatically.
 */

const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

let pollerInterval = null;
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const extractContactInfo = (text) => {
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/((\+98|0098)?[ -]?9[0-9]{9}|(0[1-9][0-9]{9,10}))/);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const nameLine = lines.find(l => {
    const words = l.split(/\s+/);
    return words.length >= 2 && words.length <= 5 && !l.includes('@') && !/^[0-9]/.test(l) && l.length < 50 && l.length > 3;
  });
  return {
    name: nameLine || '',
    email: emailMatch?.[0] || '',
    phone: phoneMatch ? phoneMatch[0].replace(/[ -]/g, '') : '',
  };
};

const parseAttachment = async (buffer, mimetype, filename) => {
  try {
    const name = (filename || '').toLowerCase();
    if (mimetype === 'application/pdf' || name.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse');
      const result = await pdfParse(buffer);
      return result.text;
    } else if (mimetype.includes('wordprocessingml') || name.endsWith('.docx') || name.endsWith('.doc')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
  } catch { /* ignore parse error */ }
  return '';
};

const pollCompany = async (companyId, emailConfig) => {
  if (!emailConfig?.enabled || !emailConfig?.host || !emailConfig?.user || !emailConfig?.password) return;

  let client;
  try {
    const { ImapFlow } = require('imapflow');
    const { simpleParser } = require('mailparser');

    client = new ImapFlow({
      host: emailConfig.host,
      port: parseInt(emailConfig.port) || 993,
      secure: true,
      auth: { user: emailConfig.user, pass: emailConfig.password },
      logger: false,
    });

    await client.connect();
    await client.mailboxOpen('INBOX');

    const messages = client.fetch('UNSEEN', { source: true, flags: true });
    for await (const msg of messages) {
      try {
        const parsed = await simpleParser(msg.source);

        // Find resume attachments
        const attachments = (parsed.attachments || []).filter(a => {
          const name = (a.filename || '').toLowerCase();
          return name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
        });

        if (attachments.length === 0) {
          // Still mark as seen
          await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen']);
          continue;
        }

        for (const attachment of attachments) {
          const resumeText = await parseAttachment(attachment.content, attachment.contentType, attachment.filename);
          const fromInfo = extractContactInfo(resumeText);

          // Use sender email as fallback
          const senderEmail = parsed.from?.value?.[0]?.address || '';
          const senderName = parsed.from?.value?.[0]?.name || '';

          const candidateId = `email_${uuidv4().slice(0, 8)}`;
          const now = new Date().toISOString();

          const candidate = {
            id: candidateId,
            name: fromInfo.name || senderName || parsed.subject || 'نامشخص',
            email: fromInfo.email || senderEmail,
            phone: fromInfo.phone || '',
            position: emailConfig.defaultPosition || '',
            source: emailConfig.defaultSource || 'ایمیل',
            stage: 'inbox',
            rating: 0,
            createdAt: now,
            stageEnteredAt: now,
            hasResume: true,
            history: [{
              user: 'سیستم',
              action: `از ایمیل ${senderEmail} دریافت شد`,
              details: `موضوع: ${parsed.subject || ''}`,
              timestamp: now,
            }],
            comments: [],
          };

          // Save candidate
          db.prepare(`
            INSERT OR IGNORE INTO candidates (id, company_id, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(candidateId, companyId, JSON.stringify(candidate), now, now);

          // Save resume file
          db.prepare(`
            INSERT OR IGNORE INTO files (id, candidate_id, type, filename, mime_type, data)
            VALUES (?, ?, 'resume', ?, ?, ?)
          `).run(`${candidateId}_resume`, candidateId, attachment.filename, attachment.contentType, attachment.content);
        }

        await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen']);
      } catch (msgErr) {
        console.error('[EmailPoller] Error processing message:', msgErr.message);
      }
    }

    await client.logout();
  } catch (err) {
    console.error(`[EmailPoller] Error for company ${companyId}:`, err.message);
    if (client) try { await client.logout(); } catch { /* ignore */ }
  }
};

const pollAll = async () => {
  const companies = db.prepare('SELECT id FROM companies').all();
  for (const company of companies) {
    const row = db.prepare('SELECT data FROM settings WHERE company_id = ?').get(company.id);
    if (!row) continue;
    const settings = JSON.parse(row.data);
    if (settings.emailImport?.enabled) {
      await pollCompany(company.id, settings.emailImport);
    }
  }
};

const startPoller = () => {
  if (pollerInterval) clearInterval(pollerInterval);
  // Poll once at startup (after a short delay to let server initialize)
  setTimeout(pollAll, 10_000);
  pollerInterval = setInterval(pollAll, POLL_INTERVAL_MS);
  console.log('[EmailPoller] Started — polling every 5 minutes.');
};

const restartPoller = (companyId) => {
  console.log(`[EmailPoller] Config updated for company ${companyId}, scheduling immediate poll.`);
  setTimeout(pollAll, 2_000);
};

module.exports = { startPoller, restartPoller };
