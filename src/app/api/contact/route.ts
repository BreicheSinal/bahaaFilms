import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json(
        { error: 'Missing Web3Forms access key' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const web3formsResponse = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_key: accessKey,
        name,
        email,
        subject,
        message,
      }),
    });

    const web3formsResult = await web3formsResponse.json();
    if (!web3formsResponse.ok || web3formsResult?.success === false) {
      return NextResponse.json(
        { error: web3formsResult?.message || 'Failed to send message' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
