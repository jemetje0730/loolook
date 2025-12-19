import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { Resend } from 'resend';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

// Resend instance - only create if API key exists
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, message } = body;

    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO contact_messages (email, message, created_at)
      VALUES (${email}, ${message}, NOW())
    `;

    // Send email notification to admin
    if (resend && process.env.ADMIN_EMAIL) {
      try {
        await resend.emails.send({
          from: 'LooLook <onboarding@resend.dev>',
          to: process.env.ADMIN_EMAIL,
          subject: '[LooLook] 새로운 Contact 문의',
          html: `
            <h2>새로운 Contact 문의</h2>
            <p><strong>보낸 사람:</strong> ${email}</p>
            <p><strong>내용:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">문의 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      { success: true, message: 'Contact message sent successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contact message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
