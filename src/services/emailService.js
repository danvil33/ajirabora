import axios from 'axios';

// Log everything at startup
console.log('🚀 EMAIL SERVICE LOADING...');
console.log('📋 All VITE environment variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE')));

// Try to get API key from multiple possible sources
const getApiKey = () => {
  // Try different possible variable names
  const possibleKeys = [
    import.meta.env.VITE_BREVO_API_KEY,
    import.meta.env.VITE_BREVO_KEY,
    import.meta.env.BREVO_API_KEY,
    import.meta.env.VITE_API_KEY,
    import.meta.env.VITE_BREVO_API_KEY?.trim()
  ];
  
  for (const key of possibleKeys) {
    if (key && key.startsWith('xkeysib')) {
      console.log('✅ Found valid API key format');
      return key;
    }
  }
  
  // Check if any key exists but has wrong format
  const rawKey = import.meta.env.VITE_BREVO_API_KEY;
  if (rawKey) {
    console.log('⚠️ API key exists but format might be wrong');
    console.log('Key starts with:', rawKey.substring(0, 10));
    console.log('Key length:', rawKey.length);
    return rawKey;
  }
  
  console.log('❌ No API key found in environment variables');
  return null;
};

// Try to get sender email from multiple sources
const getSenderEmail = () => {
  const possibleEmails = [
    import.meta.env.VITE_BREVO_EMAIL,
    import.meta.env.VITE_SENDER_EMAIL,
    import.meta.env.BREVO_EMAIL,
    'dallen02a@gmail.com' // Fallback
  ];
  
  for (const email of possibleEmails) {
    if (email && email.includes('@')) {
      console.log('✅ Found sender email:', email);
      return email;
    }
  }
  
  console.log('⚠️ Using fallback sender email: dallen02a@gmail.com');
  return 'dallen02a@gmail.com';
};

const BREVO_CONFIG = {
  API_KEY: getApiKey(),
  SENDER_EMAIL: getSenderEmail(),
  SENDER_NAME: 'AjiraBora'
};

const LOGO_URL = 'https://i.imgur.com/AEM9UJR.png';

// Final configuration check
console.log('=== FINAL BREVO CONFIGURATION ===');
console.log('API Key exists:', !!BREVO_CONFIG.API_KEY);
console.log('API Key preview:', BREVO_CONFIG.API_KEY ? `${BREVO_CONFIG.API_KEY.substring(0, 15)}...` : 'MISSING');
console.log('API Key length:', BREVO_CONFIG.API_KEY?.length || 0);
console.log('Sender Email:', BREVO_CONFIG.SENDER_EMAIL);
console.log('================================');

const getAppUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://ajirabora.vercel.app';
};

// Test function you can call from browser console
window.testBrevoConfig = () => {
  console.log('=== MANUAL CONFIG TEST ===');
  console.log('VITE_BREVO_API_KEY:', import.meta.env.VITE_BREVO_API_KEY);
  console.log('All VITE vars:', import.meta.env);
  console.log('BREVO_CONFIG:', BREVO_CONFIG);
  console.log('========================');
  return BREVO_CONFIG;
};

export const sendVerificationEmail = async (userEmail, userName, verificationLink) => {
  console.log('📧 sendVerificationEmail called');
  console.log('Recipient:', userEmail);
  console.log('Current config:', {
    hasApiKey: !!BREVO_CONFIG.API_KEY,
    senderEmail: BREVO_CONFIG.SENDER_EMAIL,
    apiKeyPreview: BREVO_CONFIG.API_KEY ? BREVO_CONFIG.API_KEY.substring(0, 10) : null
  });
  
  // Validate configuration
  if (!BREVO_CONFIG.API_KEY) {
    console.error('❌ CRITICAL: No API key found!');
    console.error('Please add VITE_BREVO_API_KEY to Vercel environment variables');
    return { 
      success: false, 
      error: 'Email service not configured - missing API key',
      debug: { hasApiKey: false, hasSenderEmail: !!BREVO_CONFIG.SENDER_EMAIL }
    };
  }

  try {
    const appUrl = getAppUrl();
    const currentYear = new Date().getFullYear();
    
    const requestBody = {
      sender: {
        name: BREVO_CONFIG.SENDER_NAME,
        email: BREVO_CONFIG.SENDER_EMAIL
      },
      to: [{
        email: userEmail,
        name: userName
      }],
      subject: 'Verify Your Email Address - AjiraBora',
      htmlContent: `<!DOCTYPE html>
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
      <h2>Welcome, ${userName}! 👋</h2>
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
</html>`
    };
    
    const requestHeaders = {
      'api-key': BREVO_CONFIG.API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log('📤 Sending request to Brevo...');
    console.log('Headers (api-key hidden):', { ...requestHeaders, 'api-key': '***HIDDEN***' });
    
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      requestBody,
      { headers: requestHeaders }
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Response:', response.data);
    return { success: true, messageId: response.data.messageId };
    
  } catch (error) {
    console.error('❌ Email failed!');
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
    
    // Check for specific error types
    if (error.response?.status === 401) {
      console.error('🔑 AUTHENTICATION ERROR: Your API key is invalid or missing');
      console.error('Current API key preview:', BREVO_CONFIG.API_KEY?.substring(0, 15));
      console.error('API key length:', BREVO_CONFIG.API_KEY?.length);
      console.error('Make sure your VITE_BREVO_API_KEY in Vercel starts with "xkeysib-"');
    }
    
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      debug: {
        hasApiKey: !!BREVO_CONFIG.API_KEY,
        apiKeyPreview: BREVO_CONFIG.API_KEY ? BREVO_CONFIG.API_KEY.substring(0, 15) : null,
        senderEmail: BREVO_CONFIG.SENDER_EMAIL
      }
    };
  }
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  if (!BREVO_CONFIG.API_KEY) {
    console.error('❌ Cannot send welcome email: No API key');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const appUrl = getAppUrl();
    const currentYear = new Date().getFullYear();
    
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: BREVO_CONFIG.SENDER_NAME,
          email: BREVO_CONFIG.SENDER_EMAIL
        },
        to: [{ email: userEmail, name: userName }],
        subject: 'Welcome to AjiraBora! 🚀',
        htmlContent: `<!DOCTYPE html>
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
      <h2>Welcome to AjiraBora, ${userName}! 🎉</h2>
      <p class="message">Your email has been successfully verified. You're now ready to explore opportunities.</p>
      <a href="${appUrl}" class="button">Get Started →</a>
    </div>
    <div class="footer">
      <p>© ${currentYear} AjiraBora. Connecting Tanzania's talent.</p>
      <p><a href="${appUrl}">${appUrl}</a></p>
    </div>
  </div>
</body>
</html>`
      },
      {
        headers: {
          'api-key': BREVO_CONFIG.API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Welcome email sent to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Welcome email error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const sendNewJobAlertEmail = async (userEmail, userName, jobData) => {
  if (!BREVO_CONFIG.API_KEY) {
    console.error('❌ Cannot send job alert: No API key');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const appUrl = getAppUrl();
    const currentYear = new Date().getFullYear();
    
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: BREVO_CONFIG.SENDER_NAME,
          email: BREVO_CONFIG.SENDER_EMAIL
        },
        to: [{ email: userEmail, name: userName }],
        subject: `📢 New Job Alert: ${jobData.title} at ${jobData.company}`,
        htmlContent: `
          <!DOCTYPE html>
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
              .button { background: #FF8C00; color: white; padding: 12px 28px; text-decoration: none; border-radius: 50px; display: inline-block; margin-top: 10px; font-weight: 600; transition: all 0.3s ease; }
              .button:hover { background: #e07c00; transform: scale(1.02); }
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
                
                <h2 style="color: #1A2A4A; margin-bottom: 10px;">Hello ${userName}! 👋</h2>
                
                <p>A new job has been posted that might interest you:</p>
                
                <div class="job-card">
                  <h3 class="job-title">${jobData.title}</h3>
                  <p class="company">🏢 ${jobData.company}</p>
                  <div>
                    <span class="detail">📍 ${jobData.location || 'Remote'}</span>
                    ${jobData.salary ? `<span class="detail">💰 ${jobData.salary}</span>` : ''}
                    <span class="detail">📋 ${jobData.type || 'Full-time'}</span>
                    ${jobData.level ? `<span class="detail">📊 ${jobData.level}</span>` : ''}
                  </div>
                  <div class="description">
                    ${jobData.description ? jobData.description.substring(0, 200) + '...' : 'No description provided'}
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${appUrl}/job/${jobData.id}/apply" class="button">
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
          </html>
        `
      },
      {
        headers: {
          'api-key': BREVO_CONFIG.API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log(`✅ Job alert sent to ${userEmail}`);
    return { success: true, messageId: response.data.messageId };
    
  } catch (error) {
    console.error('❌ Job alert email error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const sendBatchJobAlerts = async (jobSeekers, jobData) => {
  if (!BREVO_CONFIG.API_KEY) {
    console.error('❌ Cannot send batch alerts: No API key');
    return { sent: 0, failed: jobSeekers.length, total: jobSeekers.length };
  }

  const results = {
    sent: 0,
    failed: 0,
    total: jobSeekers.length
  };
  
  const batchSize = 5;
  for (let i = 0; i < jobSeekers.length; i += batchSize) {
    const batch = jobSeekers.slice(i, i + batchSize);
    const promises = batch.map(seeker => 
      sendNewJobAlertEmail(seeker.email, seeker.name, jobData)
    );
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(result => {
      if (result.success) results.sent++;
      else results.failed++;
    });
    
    if (i + batchSize < jobSeekers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`📊 Batch job alerts: ${results.sent} sent, ${results.failed} failed`);
  return results;
};

// Export test function
export const testEmailConfig = () => {
  console.log('=== EMAIL CONFIG TEST ===');
  console.log('API Key exists:', !!BREVO_CONFIG.API_KEY);
  console.log('API Key preview:', BREVO_CONFIG.API_KEY?.substring(0, 15));
  console.log('Sender Email:', BREVO_CONFIG.SENDER_EMAIL);
  console.log('========================');
  return BREVO_CONFIG;
};