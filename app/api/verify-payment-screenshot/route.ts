import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface VerificationResult {
    verified: boolean;
    checks: {
        is_payment_screenshot: boolean;
        amount_match: boolean | null;
        is_duplicate: boolean;
    };
    extracted: {
        is_payment: boolean;
        app_name: string | null;
        amount: number | null;
        transaction_id: string | null;
        date: string | null;
        status: string | null;
        upi_id: string | null;
    };
    message: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { imageUrl, expectedAmount } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { error: "imageUrl is required" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        // Step 1: Fetch the image and convert to base64
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            return NextResponse.json(
                { error: "Failed to fetch image" },
                { status: 400 }
            );
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");
        const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

        // Step 2: Analyze with Gemini Vision
        const prompt = `You are a payment screenshot verification system. Analyze this image and determine if it is a genuine UPI/bank payment screenshot (e.g. from Google Pay, PhonePe, Paytm, Amazon Pay, SuperMoney, Cred, or any banking app).

Extract the following information and respond ONLY with valid JSON (no markdown, no code fences):

{
  "is_payment": true/false,
  "app_name": "name of payment app or null",
  "amount": numeric amount or null,
  "transaction_id": "transaction/UTR/reference number as string or null",
  "date": "payment date as string or null",
  "status": "success/pending/failed/null",
  "upi_id": "payee UPI ID if visible or null"
}

Rules:
- is_payment should be true if this looks like a payment receipt/confirmation screen, even if you can't identify the app name.
- Look for "Transaction ID", "Txn ID", "UTR", "Ref No", "UPI Ref No", "Order ID", or similar labels for the transaction identifier.
- Payment status might be indicated by a green checkmark, "Payment Successful", "Paid", "Sent", or similar text.
- Extract the EXACT amount shown (ignore currency symbols like ₹, Rs, INR).
- Be flexible with layout; different apps have different designs.
- If a field is ambiguous or missing, set it to null.`;

        let responseText = "";
        try {
            const response = await genai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Image,
                                },
                            },
                        ],
                    },
                ],
            });
            responseText = response.text?.trim() || "";
            console.log("🤖 Gemini Raw Response:", responseText); // Debug logging
        } catch (apiError: any) {
            console.error("Gemini API Error:", apiError);

            // Check for 429/Resource Exhausted
            if (apiError.status === 429 || apiError.message?.includes("429") || apiError.message?.includes("Quota exceeded")) {
                return NextResponse.json({
                    verified: false,
                    checks: {
                        is_payment_screenshot: false,
                        amount_match: null,
                        is_duplicate: false,
                    },
                    extracted: {
                        is_payment: false,
                        app_name: null,
                        amount: null,
                        transaction_id: null,
                        date: null,
                        status: null,
                        upi_id: null,
                    },
                    message: "AI server is busy (rate limit). Please try again in a minute, or submit order for manual verification.",
                } as VerificationResult);
            }

            throw apiError; // Re-throw other errors to be caught by outer try-catch
        }

        // Parse the JSON response from Gemini
        let extracted;
        try {
            // Clean potential markdown code fences
            const cleanJson = responseText
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
            extracted = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", responseText, parseError);
            return NextResponse.json({
                verified: false,
                checks: {
                    is_payment_screenshot: false,
                    amount_match: null,
                    is_duplicate: false,
                },
                extracted: {
                    is_payment: false,
                    app_name: null,
                    amount: null,
                    transaction_id: null,
                    date: null,
                    status: null,
                    upi_id: null,
                },
                message: "Could not analyze screenshot (AI response error). Admin will verify manually.",
            } as VerificationResult);
        }

        // Step 3: Check amount match
        let amountMatch: boolean | null = null;
        if (extracted.amount !== null && expectedAmount) {
            const extractedAmt = parseFloat(extracted.amount);
            const expectedAmt = parseFloat(expectedAmount);
            // Allow ±1 rupee tolerance for rounding
            amountMatch = Math.abs(extractedAmt - expectedAmt) <= 1;
        }

        // Step 4: Check for duplicate transaction ID
        let isDuplicate = false;
        if (extracted.transaction_id) {
            const supabase = await createClient();
            const { data: existing } = await supabase
                .from("orders")
                .select("id")
                .eq("extracted_transaction_id", extracted.transaction_id)
                .limit(1);

            isDuplicate = !!(existing && existing.length > 0);
        }

        // Step 5: Determine overall verdict
        const isPayment = extracted.is_payment === true;
        const statusOk = !extracted.status || extracted.status === "success";
        const verified = isPayment && (amountMatch !== false) && !isDuplicate && statusOk;

        // Build message
        let message = "";
        if (!isPayment) {
            message = "This doesn't appear to be a payment screenshot.";
        } else if (isDuplicate) {
            message = "This transaction ID has been used in a previous order.";
        } else if (amountMatch === false) {
            message = `Amount mismatch: screenshot shows ₹${extracted.amount}, expected ₹${expectedAmount}.`;
        } else if (extracted.status === "failed") {
            message = "This payment appears to have failed.";
        } else if (extracted.status === "pending") {
            message = "This payment appears to be pending.";
        } else if (verified) {
            message = "Payment screenshot verified successfully!";
        } else {
            message = "Screenshot received. Admin will verify.";
        }

        const result: VerificationResult = {
            verified,
            checks: {
                is_payment_screenshot: isPayment,
                amount_match: amountMatch,
                is_duplicate: isDuplicate,
            },
            extracted: {
                is_payment: isPayment,
                app_name: extracted.app_name || null,
                amount: extracted.amount !== null ? parseFloat(extracted.amount) : null,
                transaction_id: extracted.transaction_id || null,
                date: extracted.date || null,
                status: extracted.status || null,
                upi_id: extracted.upi_id || null,
            },
            message,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            {
                verified: false,
                checks: {
                    is_payment_screenshot: false,
                    amount_match: null,
                    is_duplicate: false,
                },
                extracted: {
                    is_payment: false,
                    app_name: null,
                    amount: null,
                    transaction_id: null,
                    date: null,
                    status: null,
                    upi_id: null,
                },
                message: "Verification failed. Admin will verify manually.",
            } as VerificationResult,
            { status: 200 } // Still 200 so frontend doesn't break
        );
    }
}
