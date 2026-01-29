import { Metadata } from 'next';
import { Footer } from '@/components/sections';

export const metadata: Metadata = {
    title: 'Privacy Policy | Attar al-Jannah',
    description: 'Privacy Policy for Attar al-Jannah - Learn how we collect, use, and protect your information.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                    <p className="mb-4">
                        Welcome to Attar al-Jannah (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                    <p className="mb-4">
                        We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Personal Information Provided by You: Names, phone numbers, email addresses, mailing addresses, billing addresses, debit/credit card numbers, and other similar information.</li>
                        <li>Payment Data: We may collect data necessary to process your payment if you make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is stored by our payment processor (Razorpay).</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                    <p className="mb-4">
                        We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>To facilitate account creation and logon process.</li>
                        <li>To post testimonials.</li>
                        <li>To request feedback.</li>
                        <li>To enable user-to-user communications.</li>
                        <li>To manage user accounts.</li>
                        <li>To send administrative information to you.</li>
                        <li>To protect our services.</li>
                        <li>To enforce our terms, conditions, and policies.</li>
                        <li>To respond to legal requests and prevent harm.</li>
                        <li>To fulfill and manage your orders.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Sharing Your Information</h2>
                    <p className="mb-4">
                        We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
                    <p className="mb-4">
                        If you have questions or comments about this policy, you may email us at minhajuljanna786@gmail.com
                    </p>
                </section>
            </div>
        </div>
    );
}
