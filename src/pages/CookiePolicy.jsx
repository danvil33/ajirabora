import React from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 2026</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What Are Cookies?</h2>
              <p>Cookies are small text files that are placed on your computer, smartphone, or other device when you visit our website. They help us recognize your device and remember information about your visit.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How AjiraBora Uses Cookies</h2>
              <p className="mb-2">We use cookies to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our platform</li>
                <li>Improve our services and user experience</li>
                <li>Show you relevant job recommendations</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Types of Cookies We Use</h2>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Essential Cookies</h3>
                <p className="text-sm">Required for the website to function properly. You cannot disable these.</p>
                <ul className="list-disc pl-6 text-sm mt-1">
                  <li>Session cookies (keep you logged in)</li>
                  <li>Security cookies (prevent fraud)</li>
                  <li>Load balancing cookies</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Preference Cookies</h3>
                <p className="text-sm">Remember your choices and settings.</p>
                <ul className="list-disc pl-6 text-sm mt-1">
                  <li>Language preferences</li>
                  <li>Dark/light mode settings</li>
                  <li>Job search filters</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Analytics Cookies</h3>
                <p className="text-sm">Help us understand how visitors interact with our platform.</p>
                <ul className="list-disc pl-6 text-sm mt-1">
                  <li>Pages visited</li>
                  <li>Time spent on site</li>
                  <li>Jobs viewed and applied for</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Marketing Cookies</h3>
                <p className="text-sm">Used to show you relevant job advertisements.</p>
                <ul className="list-disc pl-6 text-sm mt-1">
                  <li>Track job ad performance</li>
                  <li>Show personalized job recommendations</li>
                  <li>Limit how many times you see an ad</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Cookies</h2>
              <p>We use trusted third-party services that may place their own cookies:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Google Analytics</strong> - Understand website traffic</li>
                <li><strong>Facebook Pixel</strong> - Measure ad performance</li>
                <li><strong>Cloudinary</strong> - Image and file uploads</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. How Long Do Cookies Last?</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain for up to 12 months or until you delete them</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Managing Your Cookie Preferences</h2>
              <p className="mb-2">You can control and delete cookies through your browser settings:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Site Permissions → Cookies</li>
              </ul>
              <p className="mt-3 text-amber-600 text-sm">⚠️ Note: Disabling cookies may affect some features like staying logged in or saving your preferences.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookie Consent</h2>
              <p>When you first visit AjiraBora, you will see a cookie banner asking for your consent. By continuing to use our platform, you agree to our use of cookies as described in this policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Updates to This Policy</h2>
              <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
              <p>If you have questions about our use of cookies, please contact us:</p>
              <p className="mt-2">
                Email: <a href="mailto:privacy@ajirabora.com" className="text-[#FF8C00] hover:underline">privacy@ajirabora.com</a>
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

export default CookiePolicy;