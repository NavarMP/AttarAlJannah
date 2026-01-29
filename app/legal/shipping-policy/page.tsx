import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shipping Policy | Attar al-Jannah',
    description: 'Shipping and Delivery Policy for Attar al-Jannah.',
};

export default function ShippingPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Shipping and Delivery Policy</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Shipping Policy</h2>
                    <p className="mb-4">
                        We currently ship to addresses within India. Orders are typically processed and shipped within 1-2 business days after the order is placed.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Delivery Timelines</h2>
                    <p className="mb-4">
                        Estimated delivery time depends on the destination:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Kerala: 2-4 business days</li>
                        <li>South India (outside Kerala): 3-6 business days</li>
                        <li>Rest of India: 5-8 business days</li>
                    </ul>
                    <p className="mb-4">
                        Please note that these are estimated timelines and actual delivery times may vary due to external factors such as courier delays, holidays, or weather conditions.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Shipping Charges</h2>
                    <p className="mb-4">
                        Shipping charges are calculated based on the order value and delivery location. The applicable shipping charge will be displayed at the time of checkout.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Tracking</h2>
                    <p className="mb-4">
                        Once your order has been shipped, you will receive a shipping confirmation email/SMS containing the tracking number and courier details. You can use this information to track the status of your delivery.
                    </p>
                </section>
            </div>
        </div>
    );
}
