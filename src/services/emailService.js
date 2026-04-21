import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const LOGO_URL = 'https://i.imgur.com/AEM9UJR.png';

const BREVO_CONFIG = {
  API_KEY: import.meta.env.VITE_BREVO_API_KEY?.trim(),
  SENDER_EMAIL: 'dallen02a@gmail.com',
  SENDER_NAME: 'AjiraBora',
};

const getAppUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://ajirabora.com';
};

const logBrevoDebug = () => {
  console.log('=== BREVO DEBUG START ===');
  console.log('BREVO KEY EXISTS:', !!BREVO_CONFIG.API_KEY);
  console.log('BREVO KEY LENGTH:', BREVO_CONFIG.API_KEY?.length || 0);
  console.log(
    'BREVO KEY PREFIX:',
    BREVO_CONFIG.API_KEY ? BREVO_CONFIG.API_KEY.slice(0, 10) : 'missing'
  );
  console.log('BREVO SENDER EMAIL:', BREVO_CONFIG.SENDER_EMAIL);
  console.log('=== BREVO DEBUG END ===');
};

const getBrevoErrorMessage = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const apiMessage = data?.message;
  const apiCode = data?.code;

  if (!BREVO_CONFIG.API_KEY) {
    return 'Brevo API key is missing. Check VITE_BREVO_API_KEY in Vercel and redeploy.';
  }

  if (status === 401 && apiMessage) {
    return `Brevo unauthorized: ${apiMessage}${apiCode ? ` (${apiCode})` : ''}`;
  }

  if (status === 400 && apiMessage) {
    return `Brevo bad request: ${apiMessage}`;
  }

  if (status === 403 && apiMessage) {
    return `Brevo forbidden: ${apiMessage}`;
  }

  return apiMessage || error?.message || 'Failed to send email.';
};

const sendBrevoEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  logBrevoDebug();

  if (!BREVO_CONFIG.API_KEY) {
    const errorMessage =
      'Brevo API key is missing. Add VITE_BREVO_API_KEY to Vercel, then redeploy.';
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  if (!toEmail) {
    const errorMessage = 'Recipient email is required.';
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: BREVO_CONFIG.SENDER_NAME,
          email: BREVO_CONFIG.SENDER_EMAIL,
        },
        to: [
          {
            email: toEmail,
            name: toName || 'User',
          },
        ],
        subject,
        htmlContent,
      },
      {
        headers: {
          'api-key': BREVO_CONFIG.API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    console.log('✅ Brevo email sent:', response?.data);
    return {
      success: true,
      data: response?.data,
      messageId: response?.data?.messageId || null,
    };
  } catch (error) {
    console.error('❌ BREVO ERROR STATUS:', error?.response?.status);
    console.error('❌ BREVO ERROR RESPONSE:', error?.response?.data);
    console.error('❌ BREVO ERROR MESSAGE:', error?.message);
    console.error('❌ FULL BREVO ERROR:', error);

    return {
      success: false,
      error: getBrevoErrorMessage(error),
    };
  }
};

export const sendVerificationEmail = async (
  userEmail,
  userName,
  verificationLink
) => {
  const appUrl = getAppUrl();
  const currentYear = new Date().getFullYear();

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Email | AjiraBora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 32px; overflow: hidden; }
    .logo-area { padding: 48px 24px 24px; text-align: center; }
    .logo { width: 170px; height: 170px; border-radius: 24px; display: inline-block; }
    .content { padding: 16px 32px 40px; text-align: center; }
    h2 { color: #1a1a2e; font-size: 26px; font-weight: 600; margin-bottom: 12px; }
    .message { color: #5a5a6e; font-size: 16px; margin-bottom: 32px; line-height: 1.6; }
    .button { background: #FF8C00; color: white; padding: 14px 36px; border-radius: 48px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; margin: 8px 0 24px; box-shadow: 0 4px 12px rgba(255, 140, 0, 0.25); }
    .expiry { background: #fff9f0; padding: 12px 20px; border-radius: 16px; font-size: 13px; color: #d69e2e; margin: 24px 0; display: inline-block; }
    .footer { background: #f8f9fc; padding: 24px 32px; text-align: center; font-size: 12px; color: #8b8ba3; border-top: 1px solid #edf2f7; }
    .footer a { color: #FF8C00; text-decoration: none; }
    @media (max-width: 480px) {
      .logo { width: 72px; height: 72px; }
      .logo-area { padding: 40px 20px 16px; }
      .content { padding: 16px 24px 32px; }
      h2 { font-size: 22px; }
      .button { padding: 12px 28px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-area">
      <img src="${LOGO_URL}" alt="AjiraBora" class="logo">
    </div>
    <div class="content">
      <h2>Welcome, ${userName || 'User'}! 👋</h2>
      <p class="message">Please verify your email address to start your journey with AjiraBora.</p>
      <a href="${verificationLink}" class="button">Verify Email Address →</a>
      <div class="expiry">⏰ This link expires in 24 hours</div>
    </div>
    <div class="footer">
      <p>© ${currentYear} AjiraBora. Connecting Tanzania's talent.</p>
      <p><a href="${appUrl}">${appUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

  return sendBrevoEmail({
    toEmail: userEmail,
    toName: userName,
    subject: 'Verify Your Email Address - AjiraBora',
    htmlContent,
  });
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  const appUrl = getAppUrl();
  const currentYear = new Date().getFullYear();

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome | AjiraBora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 32px; overflow: hidden; }
    .logo-area { padding: 48px 24px 24px; text-align: center; }
    .logo { width: 88px; height: 88px; border-radius: 24px; display: inline-block; }
    .content { padding: 16px 32px 40px; text-align: center; }
    h2 { color: #1a1a2e; font-size: 26px; font-weight: 600; margin-bottom: 12px; }
    .message { color: #5a5a6e; font-size: 16px; margin-bottom: 32px; line-height: 1.6; }
    .button { background: #FF8C00; color: white; padding: 14px 36px; border-radius: 48px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 140, 0, 0.25); }
    .footer { background: #f8f9fc; padding: 24px 32px; text-align: center; font-size: 12px; color: #8b8ba3; border-top: 1px solid #edf2f7; }
    .footer a { color: #FF8C00; text-decoration: none; }
    @media (max-width: 480px) {
      .logo { width: 72px; height: 72px; }
      .logo-area { padding: 40px 20px 16px; }
      .content { padding: 16px 24px 32px; }
      h2 { font-size: 22px; }
      .button { padding: 12px 28px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-area">
      <img src="${LOGO_URL}" alt="AjiraBora" class="logo">
    </div>
    <div class="content">
      <h2>Welcome to AjiraBora, ${userName || 'User'}! 🎉</h2>
      <p class="message">Your email has been successfully verified. You're now ready to explore opportunities.</p>
      <a href="${appUrl}" class="button">Get Started →</a>
    </div>
    <div class="footer">
      <p>© ${currentYear} AjiraBora. Connecting Tanzania's talent.</p>
      <p><a href="${appUrl}">${appUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

  return sendBrevoEmail({
    toEmail: userEmail,
    toName: userName,
    subject: 'Welcome to AjiraBora! 🚀',
    htmlContent,
  });
};

export const sendNewJobAlertEmail = async (userEmail, userName, jobData) => {
  const appUrl = getAppUrl();
  const currentYear = new Date().getFullYear();

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Job Alert - AjiraBora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Poppins', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
    .container { max-width: 550px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .header { background: #1A2A4A; padding: 25px; text-align: center; }
    .logo { color: #FF8C00; font-size: 24px; font-weight: bold; margin: 0; }
    .content { padding: 30px; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 15px; }
    .job-card { background: #f8f9fa; padding: 20px; border-radius: 16px; margin: 20px 0; border-left: 4px solid #FF8C00; }
    .job-title { color: #1A2A4A; font-size: 20px; margin: 0 0 5px; font-weight: 700; }
    .company { color: #666; margin-bottom: 10px; font-weight: 500; }
    .detail { display: inline-block; margin-right: 15px; font-size: 13px; color: #666; }
    .description { color: #555; font-size: 14px; line-height: 1.6; margin: 15px 0; }
    .button { background: #FF8C00; color: white; padding: 12px 28px; text-decoration: none; border-radius: 50px; display: inline-block; margin-top: 10px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #8b8ba3; background: #f8f9fc; border-top: 1px solid #edf2f7; }
    .footer a { color: #FF8C00; text-decoration: none; }
    @media (max-width: 480px) {
      .container { max-width: 100%; }
      .content { padding: 20px; }
      .job-title { font-size: 18px; }
      .detail { display: block; margin: 5px 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">AjiraBora</h1>
    </div>
    <div class="content">
      <div style="text-align: center;">
        <span class="badge">📢 NEW OPPORTUNITY</span>
      </div>

      <h2 style="color: #1A2A4A; margin-bottom: 10px;">Hello ${userName || 'User'}! 👋</h2>

      <p>A new job has been posted that might interest you:</p>

      <div class="job-card">
        <h3 class="job-title">${jobData?.title || 'New Job Opportunity'}</h3>
        <p class="company">🏢 ${jobData?.company || 'AjiraBora'}</p>
        <div>
          <span class="detail">📍 ${jobData?.location || 'Remote'}</span>
          ${jobData?.salary ? `<span class="detail">💰 ${jobData.salary}</span>` : ''}
          <span class="detail">📋 ${jobData?.type || 'Full-time'}</span>
          ${jobData?.level ? `<span class="detail">📊 ${jobData.level}</span>` : ''}
        </div>
        <div class="description">
          ${
            jobData?.description
              ? `${jobData.description.substring(0, 200)}...`
              : 'No description provided'
          }
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}/job/${jobData?.id || ''}/apply" class="button">
          Apply Now →
        </a>
      </div>

      <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
        Don't miss this opportunity! Click the button above to apply.
      </p>
    </div>
    <div class="footer">
      <p>© ${currentYear} AjiraBora. Connecting Tanzania's talent.</p>
      <p><small>You're receiving this because you registered as a job seeker.</small></p>
      <p><small><a href="${appUrl}/settings">Unsubscribe</a> from job alerts</small></p>
    </div>
  </div>
</body>
</html>`;

  return sendBrevoEmail({
    toEmail: userEmail,
    toName: userName,
    subject: `📢 New Job Alert: ${jobData?.title || 'New Opportunity'} at ${jobData?.company || 'AjiraBora'}`,
    htmlContent,
  });
};

export const sendBatchJobAlerts = async (jobSeekers = [], jobData) => {
  const results = {
    sent: 0,
    failed: 0,
    total: jobSeekers.length,
  };

  const batchSize = 5;

  for (let i = 0; i < jobSeekers.length; i += batchSize) {
    const batch = jobSeekers.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((seeker) =>
        sendNewJobAlertEmail(seeker?.email, seeker?.name, jobData)
      )
    );

    batchResults.forEach((result) => {
      if (result.success) results.sent += 1;
      else results.failed += 1;
    });

    if (i + batchSize < jobSeekers.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
};