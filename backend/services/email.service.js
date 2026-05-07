import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.MAILTRAP_TOKEN;

  if (!host || !user || !pass) {
    throw new Error("Email is not configured. Set SMTP_USER and SMTP_PASS. For Gmail, use an app password.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const fromAddress = () => process.env.EMAIL_FROM || "Optima Inventory <no-reply@optima-inventory.local>";
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";
const mobileUrl = () => process.env.MOBILE_APP_URL || "exp://192.168.1.203:8082";
const superAdminInbox = () => process.env.SUPERADMIN_REQUEST_INBOX || "romdhaniahmedrabiaa@gmail.com";

const sendEmail = async ({ to, subject, text }) => {
  try {
    return await getTransporter().sendMail({
      from: fromAddress(),
      to,
      subject,
      text,
    });
  } catch (err) {
    throw new Error(err.message || "The email provider rejected the email.");
  }
};

export const sendTrialRequestToSuperAdminEmail = async ({ request }) => {
  const loginUrl = `${clientUrl()}/login`;
  return sendEmail({
    to: superAdminInbox(),
    subject: `New Optima access request: ${request.companyName}`,
    text: [
      "A new company requested access to Optima Inventory.",
      "",
      `Company name: ${request.companyName}`,
      `Legal name: ${request.legalName || "Not provided"}`,
      `Admin name: ${request.adminName}`,
      `Email: ${request.email}`,
      `Phone: ${request.phone || "Not provided"}`,
      `Message: ${request.message || "No message"}`,
      "",
      `Review requests: ${loginUrl}`,
      "",
      "SuperAdmin login:",
      `Email: ${superAdminInbox()}`,
      "Password: 123456789",
    ].join("\n"),
  });
};

export const sendCredentialsEmail = async ({ to, name, email, password, companyName }) => {
  return sendEmail({
    to,
    subject: `Welcome to Optima Inventory - ${companyName}`,
    text: [
      `Hello ${name},`,
      "",
      "Welcome to Optima Inventory.",
      `Your company account for ${companyName} has been approved.`,
      "",
      `Login URL: ${clientUrl()}/login`,
      `Email: ${email}`,
      `Temporary password: ${password}`,
      "",
      "Please log in and change your password from Settings.",
    ].join("\n"),
  });
};

export const sendInventoryAssignmentEmail = async ({
  to,
  counterName,
  counterEmail,
  password,
  inventoryName,
  warehouseName,
  warehouseLocation,
}) => {
  return sendEmail({
    to,
    subject: `New inventory assigned: ${inventoryName}`,
    text: [
      `Hello ${counterName || counterEmail},`,
      "",
      "You have been assigned to a new inventory count.",
      "",
      `Inventory: ${inventoryName}`,
      `Warehouse: ${warehouseName}`,
      `Location: ${warehouseLocation || "No location provided"}`,
      "",
      `Mobile app link: ${mobileUrl()}`,
      `Email: ${counterEmail}`,
      `Default password: ${password}`,
      "",
      "Open the mobile app link and log in to start counting.",
    ].join("\n"),
  });
};
