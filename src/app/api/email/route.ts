import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, date, time, roomNumber } = body;

    if (!email) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    }

    // Create a Nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Dorm Barbershop" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '💈 Your Haircut Appointment Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111111; background-color: #F5F5F5; padding: 20px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #003366; text-align: center; margin-bottom: 24px; font-weight: 800; font-size: 24px;">Dorm Barbershop</h2>
          <p style="font-size: 16px;">Hi <strong>${name || 'there'}</strong>,</p>
          <p style="font-size: 16px;">Your haircut appointment has been successfully booked! We will come to your room.</p>
          
          <div style="background-color: #ffffff; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 5px solid #D4AF37; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${time}</p>
            ${roomNumber ? `<p style="margin: 8px 0;"><strong>🏠 Room:</strong> ${roomNumber}</p>` : ''}
          </div>
          
          <p style="font-size: 14px; color: #555555;">If you need to cancel, please log in to your dashboard and do it before the appointment to avoid penalties.</p>
          
          <p style="font-size: 14px; margin-top: 32px; color: #888888; text-align: center;">See you soon!<br><strong>Dorm Barbershop Team</strong></p>
        </div>
      `,
    };

    const barberMailOptions = {
      from: `"Dorm Barbershop System" <${process.env.EMAIL_USER}>`,
      to: `${process.env.EMAIL_USER}, jrajm.de@gmail.com`,
      subject: '📅 New Appointment Booked!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111111; background-color: #F5F5F5; padding: 20px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #003366; text-align: center; margin-bottom: 24px; font-weight: 800; font-size: 24px;">New Appointment Alert</h2>
          <p style="font-size: 16px;">A new appointment has been booked by a client.</p>
          
          <div style="background-color: #ffffff; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 5px solid #003366; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <p style="margin: 8px 0;"><strong>👤 Client:</strong> ${name || 'Unknown'}</p>
            <p style="margin: 8px 0;"><strong>✉️ Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${time}</p>
            ${roomNumber ? `<p style="margin: 8px 0;"><strong>🏠 Room:</strong> ${roomNumber}</p>` : ''}
          </div>
          
          <p style="font-size: 14px; color: #555555; text-align: center;">Check your dashboard for more details.</p>
        </div>
      `,
    };

    // Send email to client
    await transporter.sendMail(mailOptions);
    
    // Send email to barber
    await transporter.sendMail(barberMailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
