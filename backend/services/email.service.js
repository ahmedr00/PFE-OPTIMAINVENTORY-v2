import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.MAILTRAP_TOKEN;

  if (!host || !user || !pass) {
    throw new Error("Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS before approving requests.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendCredentialsEmail = async ({ to, name, email, password, companyName }) => {
  const from = process.env.EMAIL_FROM || "Optima Inventory <no-reply@optima-inventory.local>";
  const appUrl = process.env.CLIENT_URL || "http://localhost:5173";

  try {
    return await getTransporter().sendMail({
      from,
      to,
      subject: `Your Optima Inventory access for ${companyName}`,
      text: [
        `Hello ${name},`,
        "",
        `Your Optima Inventory account for ${companyName} has been approved.`,
        "",
        `Login URL: ${appUrl}/login`,
        `Email: ${email}`,
        `Temporary password: ${password}`,
        "",
        "Please log in and change your password from Settings.",
      ].join("\n"),
    });
  } catch (err) {
    throw new Error(err.message || "The email provider rejected the credentials email.");
  }
};
