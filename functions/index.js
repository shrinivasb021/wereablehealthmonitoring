const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// -------- Configure Gmail Transport --------
// Create an App Password in your Gmail account and use it here
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourclinicemail@gmail.com",
    pass: "your-16-digit-app-password"
  }
});

// -------- Trigger: When doctor adds or edits a note --------
exports.sendDoctorNoteEmail = functions.firestore
  .document("reports/{reportId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only run if note changed
    if (before.doctorNote === after.doctorNote) return null;

    const email = after.patientEmail || "demo.patient@example.com"; // optional field
    const reportUrl = after.pdfUrl;
    const subject = "🩺 New Doctor Note for Your Health Report";
    const message = `
      Hello,

      Your doctor has added a note to your latest health report.

      🕒 Date: ${new Date(after.timestamp).toLocaleString()}
      ❤️ Heart Rate: ${after.heartRate} bpm
      💨 SpO₂: ${after.spo2}%
      🌡️ Temp: ${after.temperature} °C
      🩸 BP: ${after.bpSys}/${after.bpDia} mmHg

      Doctor's Note:
      "${after.doctorNote}"

      View full report here: ${reportUrl}

      — Smart Health Monitoring System
    `;

    try {
      await transporter.sendMail({
        from: '"Smart Health" <yourclinicemail@gmail.com>',
        to: email,
        subject,
        text: message
      });
      console.log("✅ Email sent to:", email);
    } catch (error) {
      console.error("❌ Email sending failed:", error);
    }

    return null;
  });
