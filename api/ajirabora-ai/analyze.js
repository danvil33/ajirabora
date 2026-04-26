import { db } from '../_utils/firebaseAdmin.js';

// Helper to safely get value
function safeValue(value, defaultValue = '') {
  return (value !== null && value !== undefined) ? value : defaultValue;
}

// Helper to ensure array
function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length > 0) return value.split(',').map(s => s.trim());
  return [];
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
    // Check API key
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

    // Get user profile (FULL DATA)
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: `User ${userId} not found` });
    }

    // Get job details
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: `Job ${jobId} not found` });
    }

    const userData = userDoc.data();
    const jobData = jobDoc.data();

    // Extract ALL user profile fields
    const userName = safeValue(userData.fullName, userData.name);
    const userEmail = safeValue(userData.email);
    const userPhone = safeValue(userData.phone);
    const userLocation = safeValue(userData.location);
    const userCurrentRole = safeValue(userData.currentRole);
    const userYearsExperience = safeValue(userData.yearsOfExperience, 0);
    const userSkills = safeArray(userData.skills);
    const userExperience = safeValue(userData.experience);
    const userEducation = safeValue(userData.education);
    const userPortfolio = safeValue(userData.portfolio);
    const userLinkedin = safeValue(userData.linkedin);
    const userGithub = safeValue(userData.github);
    const userBio = safeValue(userData.bio);
    
    // CV/Resume data
    const hasResume = !!userData.resumeUrl;
    const resumeUrl = safeValue(userData.resumeUrl);
    const resumeFileName = safeValue(userData.resumeFileName);
    const cvText = safeValue(userData.cvText); // If user pasted CV text

    // Build comprehensive profile summary for GPT
    const profileSummary = `
=== USER PROFILE ===
Full Name: ${userName}
Email: ${userEmail}
Phone: ${userPhone}
Location: ${userLocation}
Current Role: ${userCurrentRole}
Years of Experience: ${userYearsExperience}
Skills: ${userSkills.join(', ')}
Bio/Summary: ${userBio}

=== WORK EXPERIENCE ===
${userExperience || 'Not provided'}

=== EDUCATION ===
${userEducation || 'Not provided'}

=== LINKS ===
Portfolio: ${userPortfolio || 'Not provided'}
LinkedIn: ${userLinkedin || 'Not provided'}
GitHub: ${userGithub || 'Not provided'}

=== CV/RESUME ===
${hasResume ? `✅ CV uploaded: ${resumeFileName || 'resume.pdf'}` : '❌ No CV uploaded'}
${resumeUrl ? `CV URL: ${resumeUrl}` : ''}
${cvText ? `\n=== CV TEXT ===\n${cvText.substring(0, 2000)}` : ''}
    `.trim();

    // Return COMPLETE data
    return res.status(200).json({
      success: true,
      user: {
        // Basic info
        id: userId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        location: userLocation,
        
        // Professional info
        currentRole: userCurrentRole,
        yearsOfExperience: userYearsExperience,
        skills: userSkills,
        experience: userExperience,
        education: userEducation,
        bio: userBio,
        
        // Links
        portfolio: userPortfolio,
        linkedin: userLinkedin,
        github: userGithub,
        
        // CV/Resume
        hasResume: hasResume,
        resumeUrl: resumeUrl,
        resumeFileName: resumeFileName,
        cvText: cvText || null,
        
        // Complete summary for GPT
        profileSummary: profileSummary,
        
        // Raw data (everything)
        rawProfile: userData
      },
      job: {
        id: jobId,
        title: safeValue(jobData.title),
        company: safeValue(jobData.company),
        description: safeValue(jobData.description),
        requirements: safeValue(jobData.requirements),
        skills: safeArray(jobData.skills),
        type: safeValue(jobData.type),
        location: safeValue(jobData.location),
        salary: safeValue(jobData.salary),
        level: safeValue(jobData.level),
        postedAt: safeValue(jobData.postedAt),
        rawJob: jobData
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
}