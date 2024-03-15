import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { bucket } from "../config/Firebase.js";
const prisma = new PrismaClient();

const secretKey = "adminsmkn2ketapang@";

export const generateJWTToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
  };

  // Set the expiration time for the token (e.g., 1 hour)
  const expiresIn = "1h";

  // Generate the JWT token
  const token = jwt.sign(payload, secretKey, { expiresIn });

  return token;
};

export const handleRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Periksa apakah ada field yang kosong
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Semua field harus diisi" });
    }

    // Hashing password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cek apakah email atau username telah digunakan
    const existingUser = await prisma.auth.findFirst({
      where: {
        OR: [{ username: { equals: username } }, { email: { equals: email } }],
      },
    });

    if (existingUser) {
      // Kasus email atau username sudah digunakan
      return res
        .status(400)
        .json({ error: "Email atau username sudah digunakan" });
    }

    // Generate JWT token
    const token = generateJWTToken({
      username,
      email,
      // Add any other user-related data that you want to include in the token
    });

    // Membuat pengguna di database menggunakan Prisma
    const user = await prisma.auth.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "admin", // Atur peran default sesuai kebutuhan
        token_jwt: token,
      },
    });

    // Menghasilkan token JWT
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Error mendaftarkan pengguna:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect(); // Memutus koneksi Prisma setelah operasi
  }
};

export const handleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Cek apakah username dan password diberikan
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username dan password harus diisi" });
    }

    // Temukan pengguna berdasarkan username
    const user = await prisma.auth.findUnique({
      where: {
        username,
      },
    });

    // Jika pengguna tidak ditemukan atau password tidak cocok
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Username atau password salah" });
    }

    // Cek apakah pengguna sudah memiliki token
    if (!user.token_jwt) {
      // Generate JWT token
      const token = generateJWTToken(user);

      // Simpan token ke dalam database (contoh: di kolom token_jwt)
      await prisma.auth.update({
        where: {
          uid: user.uid,
        },
        data: {
          token_jwt: token,
        },
      });
    }
    // ambil data berdasarkan uid
    const updatedUser = await prisma.auth.findUnique({
      where: {
        uid: user.uid,
      },
    });

    // Kirim respons dengan username dan email
    res.status(200).json({
      uid: updatedUser.uid,
      username: updatedUser.username,
      email: updatedUser.email,
      token: updatedUser.token_jwt,
      role: updatedUser.role,
      isLoggIn: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error saat login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect(); // Memutus koneksi Prisma setelah operasi
  }
};

export const isLoggIn = async (req, res) => {
  try {
    // Get token from the request body
    const { token } = req.body;

    // If token is not provided, send response with isLogged false
    if (!token) {
      return res
        .status(200)
        .json({ isLogged: false, error: "Token tidak valid" });
    }

    // Find user based on the token in the database
    const user = await prisma.auth.findUnique({
      where: { token_jwt: token },
    });

    // If user is found, send response with isLogged true and user information
    if (user) {
      const { username, email, token_jwt, role, uid, avatar, name } = user;
      return res.status(200).json({
        isLogged: true,
        username,
        email,
        token: token_jwt,
        role,
        uid,
        avatar,
        name,
      });
    } else {
      // If user is not found, send response with isLogged false
      return res
        .status(200)
        .json({ isLogged: false, error: "Akses ditolak karena belum login" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const Logout = async (req, res) => {
  try {
    const { token } = req.body;
    const tokenString = token.toString();

    if (!token) {
      return res
        .status(200)
        .json({ isLogged: false, error: "Token tidak valid" });
    }

    const user = await prisma.auth.findUnique({
      where: {
        token_jwt: tokenString,
      },
    });

    if (!user) {
      return res
        .status(200)
        .json({ isLogged: false, error: "Token tidak ditemukan" });
    }

    // Update user data to remove the token
    await prisma.auth.update({
      where: {
        uid: user.uid,
      },
      data: {
        token_jwt: null,
      },
    });

    res
      .status(200)
      .json({ isLogged: false, message: "Logout berhasil", status: 200 });
  } catch (error) {
    console.error("Error saat logout:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect(); // Memutus koneksi Prisma setelah operasi
  }
};

export const editProfil = async (req, res) => {
  const { uid, email, name } = req.body;
  const avatarFile = req.files && req.files.avatar;

  const parseUId = parseInt(uid);

  try {
    let avatarUrl;

    if (avatarFile) {
      // Fungsi untuk membersihkan nama file dari karakter yang tidak diizinkan
      function sanitizeFileName(input) {
        return input.replace(/[^a-zA-Z0-9_-]/g, "_");
      }

      // Menentukan nama file avatar
      const sanitizedName = sanitizeFileName(name); // You can customize this if needed
      const avatarFileName = `avatar_${sanitizedName}.jpg`; // Change the extension if needed

      // Mengambil buffer file avatar
      const avatarFileBuffer = avatarFile.data;

      // Menentukan path file di Firebase Storage
      const avatarFilePath = `Avatars/${avatarFileName}`;

      // Menginisialisasi objek file di Firebase Storage
      const avatarFileFirebase = bucket.file(avatarFilePath);

      // Menyimpan file avatar di Firebase Storage
      await avatarFileFirebase.save(avatarFileBuffer, {
        metadata: {
          contentType: avatarFile.mimetype, // Use the mimetype provided by multer
        },
      });

      // Mengambil URL file avatar dari Firebase Storage
      avatarUrl = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURIComponent(avatarFilePath)}?alt=media`;
    }

    // Update user profile with the new avatar URL
    const updatedUser = await prisma.auth.update({
      where: { uid: parseUId },
      data: {
        email,
        name: name,
        avatar: avatarUrl,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error editing profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    // Extract necessary data from request body
    const { uid, currentPassword, newPassword } = req.body;

    // Validate data
    if (!uid || !currentPassword || !newPassword) {
      return res.status(400).json({
        error: "UID, current password, and new password are required",
      });
    }

    // Find user by uid (you may need to modify this depending on your data model)
    const user = await prisma.auth.findUnique({
      where: {
        uid: uid,
      },
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if current password matches the password stored in the database
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password in the database
    await prisma.auth.update({
      where: {
        uid: uid,
      },
      data: {
        password: hashedPassword,
      },
    });

    // Send success response
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "smkn2ketapanglibrary@gmail.com",
    pass: "iljvnlykscetazqc",
  },
});

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await prisma.auth.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Email not found" });
    }
    function generateOTP() {
      let otp = "";
      const digits = "0123456789";
      for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
      }
      return otp;
    }

    const otp = generateOTP();

    await prisma.auth.update({
      where: { email },
      data: { otp },
    });

    const mailOptions = {
      from: "smkn2ketapanglibrary@gmail.com",
      to: email,
      subject: "Kode Verifikasi - Reset Password",
      html: `
      <html>
        <head>
          <style>
            /* Tambahkan CSS kustom Anda di sini */
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              background-color: #007BFF;
              color: #ffffff;
              padding: 10px 0;
              text-align: center;
            }
            .content {
              padding: 20px;
            }
            .footer {
              background-color: #007BFF;
              color: #ffffff;
              padding: 10px 0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Password</h1>
            </div>
            <div class="content">
              <p>Halo,</p>
              <p>Anda telah meminta untuk mereset password Anda. Gunakan Kode berikut untuk mereset password:</p>
              <p><strong>Kode:</strong> ${otp}</p>
              <p>Jika Anda tidak melakukan permintaan ini, silakan abaikan email ini.</p>
              <p>Salam,</p>
              <p>Terima Kasih</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} E-Library SMK Negeri 2 Ketapang
            </div>
          </div>
        </body>
      </html>
    `,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: "OTP generated and sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const auth = await prisma.auth.findFirst({
      where: {
        otp: {
          equals: otp,
        },
      },
      select: {
        email: true,
      },
    });

    if (auth) {
      return res.status(200).json({ email: auth.email });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    if (error.code === "P2025") {
      console.error("Prisma Error:", error.message);
      return res.status(500).json({ message: "Internal server error" });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const changePassowrd = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Temukan pengguna berdasarkan alamat email
    const user = await prisma.auth.findUnique({
      where: {
        email: email,
      },
    });

    // Periksa apakah pengguna ditemukan
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash kata sandi baru sebelum menyimpannya
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Perbarui kata sandi pengguna
    await prisma.auth.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
        otp: null, // Jika Anda ingin menghapus OTP setelah mengganti kata sandi
      },
    });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    // Tutup koneksi PrismaClient setelah selesai
    await prisma.$disconnect();
  }
};

