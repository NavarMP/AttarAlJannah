import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { volunteerId, cash_received } = await request.json();

        if (!volunteerId || typeof cash_received !== "number") {
            return NextResponse.json(
                { error: 'Volunteer ID and a valid cash amount are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Verify volunteer exists
        const { data: volunteer, error: volError } = await supabase
            .from('volunteers')
            .select('id, name')
            .eq('volunteer_id', volunteerId)
            .single();

        if (volError || !volunteer) {
            return NextResponse.json(
                { error: 'Invalid volunteer credentials' },
                { status: 403 }
            );
        }

        // 2. Verify order belongs to volunteer
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id')
            .eq('id', id)
            .eq('volunteer_id', volunteer.id)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found or not assigned to you' },
                { status: 404 }
            );
        }

        // 3. Update the order
        const { error: updateError } = await supabase
            .from('orders')
            .update({ cash_received })
            .eq('id', id);

        if (updateError) {
            console.error('Failed to update cash received:', updateError);
            return NextResponse.json(
                { error: 'Failed to update cash amount' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, cash_received });

    } catch (error) {
        console.error('Error in cash update handler:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
