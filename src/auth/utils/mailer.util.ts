import * as nodemailer from 'nodemailer';

const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
};

const sendVerificationEmail = async (
  to: string,
  { token, userId }: { token: string; userId: string },
) => {
  const transporter = await createTransporter();
  const url = `${process.env.APP_URL}/verify-email?token=${token}&id=${userId}`;
  console.log('process.env.COOKIE_DOMAIN', process.env.COOKIE_DOMAIN);
  const info = await transporter.sendMail({
    from: `"No Reply" <no-reply@${process.env.COOKIE_DOMAIN || 'myapp.local'}>`,
    to,
    subject: 'Verify your email',
    html: `<p>Click <a href="${url}">here</a> to verify your account</p>`,
    text: `Verify: ${url}`,
  });
  if (nodemailer.getTestMessageUrl(info)) {
    return nodemailer.getTestMessageUrl(info);
  }
};

export { createTransporter, sendVerificationEmail };
