import { db } from '../_utils/firebaseAdmin.js';

// Helper function to ensure skills is always an array
function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(s => s.trim());
  if (value === null || value === undefined) return [];
  return [];
}

// Helper function to ensure string
function ensureString(value) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.AJIRABORA_AI_KEY;
    
    if (!expectedApiKey) {
      console.error('AJIRABORA_AI_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { userId, jobId } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({ error: 'userId and jobId required' });
    }

    if (!db) {
      console.error('Firestore not initialized');
      return res.status(500).json({ error: 'Database connection error' });
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: `User ${userId} not found` });
    }

    // Get job data
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: `Job ${jobId} not found` });
    }

    const userData = userDoc.data();
    const jobData = jobDoc.data();

    // Safely extract data with fallbacks
    const userSkills = ensureArray(userData.skills);
    const jobSkills = ensureArray(jobData.skills);
    
    const userName = userData.fullName || userData.name || 'Not specified';
    const userEmail = userData.email || 'Not specified';
    const userPhone = userData.phone || 'Not specified';
    const userLocation = userData.location || 'Not specified';
    const userCurrentRole = userData.currentRole || 'Not specified';
    const userYearsExperience = userData.yearsOfExperience || 0;
    const userExperience = ensureString(userData.experience);
    const userEducation = ensureString(userData.education);
    const userPortfolio = userData.portfolio || 'Not specified';
    const userLinkedin = userData.linkedin || 'Not specified';

    // Build profile summary
    const profileSummary = `
Name: ${userName}
Email: ${userEmail}
Phone: ${userPhone}
Location: ${userLocation}
Current Role: ${userCurrentRole}
Years Experience: ${userYearsExperience}
Skills: ${userSkills.join(', ') || 'None specified'}
Experience: ${userExperience || 'None specified'}
Education: ${userEducation || 'None specified'}
Portfolio: ${userPortfolio}
LinkedIn: ${userLinkedin}
    `.trim();

    // CV/Resume info
    const hasResume = !!userData.resumeUrl;
    const resumeUrl = userData.resumeUrl || null;
    const resumeFileName = userData.resumeFileName || null;

    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        location: userLocation,
        
        // Profile summary for GPT
        profileSummary: profileSummary,
        
        // Structured data
        skills: userSkills,
        experience: userExperience,
        education: userEducation,
        currentRole: userCurrentRole,
        yearsOfExperience: userYearsExperience,
        portfolio: userPortfolio,
        linkedin: userLinkedin,
        
        // CV/Resume
        hasResume: hasResume,
        resumeUrl: resumeUrl,
        resumeFileName: resumeFileName,
        cvNote: !hasResume ? "No CV uploaded. Consider adding one." : "CV available. Ask user about their experience if needed."
      },
      job: {
        id: jobId,
        title: jobData.title || 'Not specified',
        company: jobData.company || 'Not specified',
        description: jobData.description || 'Not specified',
        requirements: jobData.requirements || 'Not specified',
        skills: jobSkills,
        type: jobData.type || 'Not specified',
        location: jobData.location || 'Not specified',
        salary: jobData.salary || 'Not specified',
        level: jobData.level || 'Not specified',
        postedAt: jobData.postedAt || 'Not specified'
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}