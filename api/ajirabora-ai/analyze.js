import { db } from '../_utils/firebaseAdmin.js';

// Helper function to fetch and extract text from PDF/URL
async function extractCVText(resumeUrl) {
  if (!resumeUrl) return null;
  
  try {
    // Fetch the file from the URL
    const response = await fetch(resumeUrl);
    const buffer = await response.arrayBuffer();
    
    // Try to extract text based on file type
    const urlLower = resumeUrl.toLowerCase();
    
    // For PDF files
    if (urlLower.endsWith('.pdf')) {
      // For PDF, we'll just return the URL and let GPT know it's a PDF
      // GPT can't read PDF directly, but we can try text extraction
      return {
        text: "PDF file - User has uploaded a resume/CV. Please ask them to paste the content or describe their experience.",
        isPdf: true,
        url: resumeUrl
      };
    }
    
    // For DOC/DOCX files
    if (urlLower.endsWith('.doc') || urlLower.endsWith('.docx')) {
      return {
        text: "DOC file - User has uploaded a resume/CV. Please ask them to paste the content or describe their experience.",
        isDoc: true,
        url: resumeUrl
      };
    }
    
    // For text files
    if (urlLower.endsWith('.txt')) {
      const text = await response.text();
      return { text: text, isText: true, url: resumeUrl };
    }
    
    return {
      text: "CV/Resume available but in a format that needs manual review.",
      url: resumeUrl
    };
    
  } catch (error) {
    console.error('CV text extraction error:', error.message);
    return { 
      text: "Unable to fetch CV content. Please ask user to describe their experience.",
      error: true
    };
  }
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

    // Extract CV text if resume exists
    let cvContent = null;
    
    if (userData.resumeUrl) {
      cvContent = await extractCVText(userData.resumeUrl);
    }

    // Build user profile summary for GPT
    const userSkills = userData.skills || [];
    const userExperience = userData.experience || '';
    const userEducation = userData.education || '';

    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        name: userData.fullName || userData.name || 'Not specified',
        email: userData.email || 'Not specified',
        phone: userData.phone || 'Not specified',
        location: userData.location || 'Not specified',
        
        // Profile summary for GPT to understand quickly
        profileSummary: `
Name: ${userData.fullName || userData.name || 'Not specified'}
Current Role: ${userData.currentRole || 'Not specified'}
Years Experience: ${userData.yearsOfExperience || 'Not specified'}
Skills: ${userSkills.join(', ') || 'Not specified'}
Experience: ${userExperience || 'Not specified'}
Education: ${userEducation || 'Not specified'}
Portfolio: ${userData.portfolio || 'Not specified'}
LinkedIn: ${userData.linkedin || 'Not specified'}
        `.trim(),
        
        // Structured data for detailed analysis
        skills: userSkills,
        experience: userExperience,
        education: userEducation,
        currentRole: userData.currentRole || '',
        yearsOfExperience: userData.yearsOfExperience || 0,
        portfolio: userData.portfolio || '',
        linkedin: userData.linkedin || '',
        
        // CV/Resume information
        hasResume: !!userData.resumeUrl,
        resumeUrl: userData.resumeUrl || null,
        resumeFileName: userData.resumeFileName || null,
        cvText: cvContent?.text || null,  // Extracted text if available
        cvNote: !userData.resumeUrl ? "No CV uploaded. Consider adding one." : 
                (cvContent?.text ? "CV content extracted successfully." : 
                "CV available but text extraction limited. Ask user about their experience.")
      },
      job: {
        id: jobId,
        title: jobData.title || 'Not specified',
        company: jobData.company || 'Not specified',
        description: jobData.description || 'Not specified',
        requirements: jobData.requirements || 'Not specified',
        skills: jobData.skills || [],
        type: jobData.type || 'Not specified',
        location: jobData.location || 'Not specified',
        salary: jobData.salary || 'Not specified',
        level: jobData.level || 'Not specified',
        postedAt: jobData.postedAt || 'Not specified'
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}