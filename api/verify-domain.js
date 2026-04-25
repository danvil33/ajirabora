// api/verify-domain.js
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Get the domain and token from request body
  const { domain, token, userId } = req.body;

  if (!domain || !token) {
    return res.status(400).json({ 
      success: false, 
      error: 'Domain and verification token are required' 
    });
  }

  try {
    // 3. Perform DNS TXT record lookup
    const txtRecords = await resolveTxt(domain);
    
    // 4. Flatten the array of records
    const allTxtValues = txtRecords.flat();
    
    // 5. Check if our token exists in any TXT record
    const tokenFound = allTxtValues.some(record => 
      record === token || record.includes(token)
    );
    
    if (!tokenFound) {
      return res.status(200).json({
        success: false,
        message: `Verification token not found. Add this TXT record to ${domain}:`,
        token: token
      });
    }
    
    // 6. Verification successful
    return res.status(200).json({
      success: true,
      message: 'Domain verified successfully!'
    });
    
  } catch (error) {
    console.error('DNS lookup error:', error);
    
    // Handle specific DNS errors
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return res.status(200).json({
        success: false,
        error: 'No TXT records found for this domain',
        token: token
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to verify domain. Please try again.'
    });
  }
}