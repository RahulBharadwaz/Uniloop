import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString()
}

const sendOTPEmail = async (email, otp) => {
    const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM || "ShareNet <onboarding@resend.dev>",
        to: [email],
        subject: "ShareNet - Verify Your College Email",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ShareNet</h1>
                    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Campus Sharing Network</p>
                </div>
                <div style="padding: 32px;">
                    <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 20px;">Verify Your Email</h2>
                    <p style="color: #6b7280; margin: 0 0 24px; font-size: 14px; line-height: 1.5;">
                        Use the code below to verify your college email address. Do not share this code with anyone.
                    </p>
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1f2937;">${otp}</span>
                    </div>
                    <p style="color: #9ca3af; margin: 0; font-size: 13px; text-align: center;">
                        This code expires in <strong>10 minutes</strong>.
                    </p>
                </div>
                <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} ShareNet. If you didn't request this, please ignore this email.
                    </p>
                </div>
            </div>
        `
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export { generateOTP, sendOTPEmail }
