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
  console.log('=== BREVO DEBUG END ===');
};

const formatBrevoError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  console.error('❌ BREVO ERROR STATUS:', status);
  console.error('❌ BREVO ERROR RESPONSE:', data);
  console.error('❌ BREVO ERROR MESSAGE:', error?.message);
  console.error('❌ FULL BREVO ERROR:', error);

  if (!BREVO_CONFIG.API_KEY) {
    return 'Brevo API key is missing. Check VITE_BREVO_API_KEY in Vercel and redeploy.';
  }

  if (status === 401) {
    return data?.message
      ? `Brevo unauthorized: ${data.message}`
      : 'Brevo unauthorized: invalid or disabled API key.';
  }

  return data?.message || error?.message || 'Failed to send email.';
};

const sendBrevoEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  logBrevoDebug();

  if (!BREVO_CONFIG.API_KEY) {
    return {
      success: false,
      error: 'Brevo API key is missing. Add VITE_BREVO_API_KEY in Vercel and redeploy.',
    };
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

    console.log('✅ Brevo email sent:', response.data);
    return { success: true, messageId: response?.data?.messageId || null };
  } catch (error) {
    return {
      success: false,
      error: formatBrevoError(error),
    };
  }
};

export const sendVerificationEmail = async (userEmail, userName, verificationLink) => {
  const appUrl = getAppUrl();
  const currentYear = new Date().getFullYear();

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-area">
      <img src="${LOGO_URL}" alt="AjiraBora" class="logo" />
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