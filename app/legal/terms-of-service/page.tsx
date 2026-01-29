import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | Attar al-Jannah',
    description: 'Terms of Service for Attar al-Jannah - Please read these terms carefully before using our service.',
};

export default function TermsOfServicePage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                    <p className="mb-4">
                        These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;you&quot;) and Attar al-Jannah (&quot;we,&quot; &quot;us&quot; or &quot;our&quot;), concerning your access to and use of the Attar al-Jannah website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the &quot;Site&quot;).
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Intellectual Property Rights</h2>
                    <p className="mb-4">
                        Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the &quot;Content&quot;) and the trademarks, service marks, and logos contained therein (the &quot;Marks&quot;) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. User Representations</h2>
                    <p className="mb-4">
                        By using the Site, you represent and warrant that:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>All registration information you submit will be true, accurate, current, and complete.</li>
                        <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                        <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
                        <li>You are not a minor in the jurisdiction in which you reside.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Products</h2>
                    <p className="mb-4">
                        All products are subject to availability. We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. Purchases and Payment</h2>
                    <p className="mb-4">
                        We accept the following forms of payment: Razorpay (Credit/Debit Cards, Net Banking, UPI, Wallets). You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Site.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                    <p className="mb-4">
                        In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at minhajuljanna786@gmail.com
                    </p>
                </section>
            </div>
        </div>
    );
}
