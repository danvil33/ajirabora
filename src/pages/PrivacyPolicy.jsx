import React from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 2026</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="mb-2">At AjiraBora, we collect information to provide better services:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Account Information:</strong> Name, email, phone number, password</li>
                <li><strong>Profile Information:</strong> Resume, skills, education, work experience</li>
                <li><strong>Employer Information:</strong> Company name, address, industry, job posts</li>
                <li><strong>Usage Data:</strong> How you interact with our platform</li>
                <li><strong>Device Information:</strong> IP address, browser type, device type</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Connect job seekers with employers</li>
                <li>Process job applications</li>
                <li>Send job alerts and notifications</li>
                <li>Improve our platform and user experience</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
              <p className="mb-2">We share information only in these circumstances:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>With Employers:</strong> When you apply for a job, your profile and resume are shared</li>
                <li><strong>Service Providers:</strong> We use third parties for hosting, analytics, email</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                <li><strong>Business Transfers:</strong> If we are acquired or merge</li>
              </ul>
              <p className="mt-2">AjiraBora never sells your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p>We implement industry-standard security measures including encryption, secure servers, and access controls. However, no method of transmission is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data</li>
              </ul>
              <p className="mt-2">To exercise these rights, contact us at <a href="mailto:privacy@ajirabora.com" className="text-[#FF8C00] hover:underline">privacy@ajirabora.com</a></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h2>
              <p>We use cookies to improve your experience, remember preferences, and analyze usage. You can disable cookies in your browser settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
              <p>We retain your data as long as your account is active. After deletion, some data may be retained for legal or legitimate business purposes.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
              <p>AjiraBora is not intended for users under 16. We do not knowingly collect data from children.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Users</h2>
              <p>Your information may be processed in Tanzania or other countries where we operate. By using AjiraBora, you consent to this transfer.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to Privacy Policy</h2>
              <p>We may update this policy. We will notify you of material changes via email or site notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Information</h2>
              <p>For privacy concerns or questions:</p>
              <p className="mt-2">
                Email: <a href="mailto:privacy@ajirabora.com" className="text-[#FF8C00] hover:underline">privacy@ajirabora.com</a><br />
                Address: Dar es Salaam, Tanzania
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2026 AjiraBora. All rights reserved.</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;