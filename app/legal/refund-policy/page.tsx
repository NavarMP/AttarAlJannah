import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refund Policy | Attar al-Jannah',
    description: 'Refund and Cancellation Policy for Attar al-Jannah.',
};

export default function RefundPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Refund and Cancellation Policy</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Cancellation Policy</h2>
                    <p className="mb-4">
                        You can cancel your order before it has been shipped. To cancel your order, please contact us immediately at minhajuljanna786@gmail.com or call us. Once the order has been shipped, it cannot be canceled.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Returns</h2>
                    <p className="mb-4">
                        Due to the nature of our products (Attar/Perfumes), we generally do not accept returns for opened or used products for hygiene and safety reasons. However, if you receive a damaged or incorrect item, please contact us within 24 hours of delivery.
                    </p>
                    <p className="mb-4">
                        To be eligible for a return in case of damage/defect:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Your item must be unused and in the same condition that you received it.</li>
                        <li>It must be in the original packaging.</li>
                        <li>You must provide the receipt or proof of purchase.</li>
                        <li>You must provide video/photo evidence of the damage/defect upon opening the package.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Refunds</h2>
                    <p className="mb-4">
                        Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
                    </p>
                    <p className="mb-4">
                        If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days (typically 5-7 business days).
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Late or Missing Refunds</h2>
                    <p className="mb-4">
                        If you haven&apos;t received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted. Next contact your bank. There is often some processing time before a refund is posted.
                        If you&apos;ve done all of this and you still have not received your refund yet, please contact us.
                    </p>
                </section>
            </div>
        </div>
    );
}
