import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { Resend } from 'resend';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

// Resend instance - only create if API key exists
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const categoryLabels: Record<string, string> = {
  toilet_report: '화장실 제보',
  correction: '정보 수정',
  bug: '버그 신고',
  suggestion: '기능 제안',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, message, email, location } = body;

    if (!category || !message) {
      return NextResponse.json(
        { error: 'Category and message are required' },
        { status: 400 }
      );
    }

    const validCategories = ['toilet_report', 'correction', 'bug', 'suggestion'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO feedback (category, message, email, location, created_at)
      VALUES (${category}, ${message}, ${email || null}, ${location || null}, NOW())
    `;

    // Send email notification to admin
    if (resend && process.env.ADMIN_EMAIL) {
      try {
        await resend.emails.send({
          from: 'LooLook <onboarding@resend.dev>',
          to: process.env.ADMIN_EMAIL,
          subject: `[LooLook] 새로운 ${categoryLabels[category]} 제보`,
          html: `
            <h2>새로운 ${categoryLabels[category]}</h2>
            <p><strong>카테고리:</strong> ${categoryLabels[category]}</p>
            ${location ? `<p><strong>위치:</strong> ${location}</p>` : ''}
            <p><strong>내용:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
            ${email ? `<p><strong>제보자 이메일:</strong> ${email}</p>` : '<p><strong>제보자 이메일:</strong> 없음</p>'}
            <hr>
            <p style="color: #666; font-size: 12px;">제보 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      { success: true, message: 'Feedback submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
