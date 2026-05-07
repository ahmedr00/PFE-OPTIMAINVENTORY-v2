import { User } from "../models/user.model.js";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

const sanitizeUser = (userDoc) => ({
  ...userDoc,
  password: undefined,
  verificationToken: undefined,
  verificationTokenExpiresAt: undefined,
  passwordResetToken: undefined,
  passwordResetExpiresAt: undefined,
});

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    // user.password = await bcryptjs.hash(password, 10);
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials 1" });
    }
    const token = generateTokenAndSetCookie(res, user._id);

    user.lastLogin = Date.now();

    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged in succesfully",
      token,
      user: {
        ...sanitizeUser(user._doc),
      },
    });
  } catch (error) {
    console.log("Error in login", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
export const createUser = async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    if (!email || !password || !name) {
      throw new Error("ALL fields are required!");
    }

    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: role || "Admin",
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      isVerified: true,
    });
    await user.save();
    //jwt
    generateTokenAndSetCookie(res, user._id);
    // await sendVerificationEmail(user.email, verificationToken);
    res.status(201).json({
      success: true,
      message: "User created succesfully",
      user: {
        ...sanitizeUser(user._doc),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Frontend compatibility endpoints (authStore.js)
export const signup = async (req, res) => createUser(req, res);

export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Lazy import to avoid circular deps if any utils depend on controllers
    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    return res.status(200).json({ success: true, user: sanitizeUser(user._doc) });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    if (!code) return res.status(400).json({ success: false, message: "Code is required" });

    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired code" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    await user.save();

    return res.status(200).json({ success: true, user: sanitizeUser(user._doc) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    // Don't leak user existence
    if (!user) return res.status(200).json({ success: true, message: "If the email exists, a reset link was generated." });

    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = token;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // Email sending intentionally omitted in this codebase
    return res.status(200).json({
      success: true,
      message: "Password reset token generated.",
      token, // dev-friendly; remove in production if desired
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    if (!token) return res.status(400).json({ success: false, message: "Token is required" });
    if (!password) return res.status(400).json({ success: false, message: "Password is required" });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    user.password = await bcryptjs.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
