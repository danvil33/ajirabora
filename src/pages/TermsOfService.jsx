import React from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 2026</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using AjiraBora (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our Platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p>AjiraBora is an online platform that connects job seekers with employers. We provide job posting, application management, and recruitment services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
              <p className="mb-2">You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Job Seekers</h2>
              <p className="mb-2">As a job seeker on AjiraBora, you agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide truthful information in your profile and applications</li>
                <li>Not submit fraudulent or misleading applications</li>
                <li>Respect employer's intellectual property and confidentiality</li>
                <li>Not use the platform to harass or spam employers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Employers</h2>
              <p className="mb-2">As an employer on AjiraBora, you agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Post accurate and lawful job opportunities</li>
                <li>Not post fraudulent, misleading, or illegal jobs</li>
                <li>Respect applicant privacy and data protection</li>
                <li>Not discriminate against any applicant</li>
                <li>Pay any applicable fees for premium services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Prohibited Activities</h2>
              <p className="mb-2">You may not:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Post jobs that require upfront payment from applicants</li>
                <li>Collect personal information for unlawful purposes</li>
                <li>Impersonate any person or entity</li>
                <li>Upload malicious code or viruses</li>
                <li>Scrape or copy our content without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Content Ownership</h2>
              <p>You retain ownership of content you post. By posting, you grant AjiraBora a license to display and distribute your content on our platform. AjiraBora owns all platform design, logos, and code.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Fees and Payments</h2>
              <p>Some features may require payment. All fees are clearly displayed before purchase. Payments are non-refundable unless otherwise stated. We may change fees with notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Termination</h2>
              <p>We may suspend or terminate your account for violating these terms. You may delete your account at any time. Upon termination, your content may be removed.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
              <p>The platform is provided "as is" without warranties. We do not guarantee job placement or applicant quality. AjiraBora is not responsible for user conduct.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
              <p>AjiraBora shall not be liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the amount paid to us, if any.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
              <p>These terms shall be governed by the laws of Tanzania. Any disputes shall be resolved in Tanzanian courts.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
              <p>We may update these terms. Continued use constitutes acceptance. We will notify you of material changes via email or site notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Us</h2>
              <p>Questions about these terms? Contact us at: <a href="mailto:legal@ajirabora.com" className="text-[#FF8C00] hover:underline">legal@ajirabora.com</a></p>
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

export default TermsOfService;