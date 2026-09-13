// src/app/api/notify/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  EmailTemplateResult,
  getBookAartiTemplates,
  getNewUserTemplates,
  getReportAartiTemplates,
  getDirectOfflineAartiTemplates,
  getConnectFormTemplates,
  getAllocationTemplates,
  getCancelledTemplates,
  getRequestActionTemplates,
  getReassignTemplates,
  getTestMailTemplate,
} from "@/lib/emailTemplates";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface OutgoingMail extends EmailTemplateResult {
  to: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mailfor = body.mailfor || body.action;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "";
    const senderEmail = process.env.SMTP_USER || "";

    // Legacy address normalizer
    if (body.sanapatimail === "santa.gopeshwardas@gmail.com") {
      body.sanapatimail = "santa.gopeshwar.das@gmail.com";
    }

    const messages: OutgoingMail[] = [];

    switch (mailfor) {
      case "book_aarti": {
        const t = getBookAartiTemplates({
          hostname: body.hostname || body.name,
          hostmail: body.hostmail,
          mobile: body.mobile,
          emirate: body.emirate,
          area: body.area || body.city,
          landmark: body.landmark,
          address: body.address,
          date: body.date || body.aartiDate,
          time: body.time || body.aartiTime,
          sanname: body.sanname,
          sanapatimail: body.sanapatimail,
          adminmail: body.adminmail || adminEmail,
        });

        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        if (t.host && body.hostmail) messages.push({ to: body.hostmail, ...t.host });
        if (t.senapati && body.sanapatimail) messages.push({ to: body.sanapatimail, ...t.senapati });
        break;
      }

      case "new_user": {
        const t = getNewUserTemplates({
          sanname: body.sanname,
          email: body.sanapatimail || body.email,
          mobile: body.mobile,
          whatsapp: body.wpname || body.whatsapp,
          area: body.area,
          emirate: body.emirate,
        });

        const targetEmail = body.sanapatimail || body.email;
        if (targetEmail) messages.push({ to: targetEmail, ...t.applicant });
        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        break;
      }

      case "report_Aarti": {
        const t = getReportAartiTemplates({
          sanname: body.sanname,
          hostname: body.host || body.hostname,
          hostmail: body.usermail || body.hostmail,
          isregister: body.isregister,
          address: body.address,
          date: body.date || body.aartiDate,
          time: body.time || body.aartiTime,
        });

        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        const hMail = body.usermail || body.hostmail;
        if (t.host && hMail) messages.push({ to: hMail, ...t.host });
        break;
      }

      case "direct_offline_aarti": {
        const t = getDirectOfflineAartiTemplates({
          sanname: body.sanname,
          hostname: body.host || body.hostname,
          hostmail: body.usermail || body.hostmail,
          address: body.address,
          date: body.date || body.aartiDate,
          time: body.time || body.aartiTime,
        });

        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        const hMail = body.usermail || body.hostmail;
        if (t.host && hMail) messages.push({ to: hMail, ...t.host });
        break;
      }

      case "connectform": {
        const t = getConnectFormTemplates({
          name: body.Name,
          mobile: body.Mobile_no,
          email: body.Email,
        });

        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        if (t.user && body.Email) messages.push({ to: body.Email, ...t.user });
        break;
      }

      case "allocation": {
        const t = getAllocationTemplates({
          hostname: body.uname,
          hostmail: body.umail,
          sanname: body.sanname,
          sanapatimail: body.sanapatimail,
          mobile: body.mobile,
          date: body.date,
          time: body.time,
          address: body.address,
          landmark: body.landmark,
          area: body.area,
          emirate: body.emirate,
        });

        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        if (t.senapati && body.sanapatimail) messages.push({ to: body.sanapatimail, ...t.senapati });
        if (t.host && body.umail) messages.push({ to: body.umail, ...t.host });
        break;
      }

      case "cancelled": {
        const t = getCancelledTemplates({
          hostname: body.uname,
          hostmail: body.umail,
          sanname: body.sanname,
          sanapatimail: body.sanapatimail,
          mobile: body.mobile,
          date: body.date,
          time: body.time,
          address: body.address,
          landmark: body.landmark,
          area: body.area,
          emirate: body.emirate,
          reason: body.Reason,
        });

        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        if (t.senapati && body.sanapatimail) messages.push({ to: body.sanapatimail, ...t.senapati });
        if (t.host && body.umail) messages.push({ to: body.umail, ...t.host });
        break;
      }

      case "requestaction": {
        const t = getRequestActionTemplates({
          sanname: body.name,
          status: body.status,
          reason: body.Reason,
          mobile: body.mobile,
          sanapatimail: body.sanapatimail,
        });

        if (body.sanapatimail) messages.push({ to: body.sanapatimail, ...t.applicant });
        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        break;
      }

      case "reasign": {
        const t = getReassignTemplates({
          sanname: body.sanname,
          hostname: body.Host,
          hostmail: body.hostmail,
          mobile: body.mobile,
          sanapatimail: body.sanapatimail,
          date: body.date,
          time: body.time,
          address: body.address,
          reason: body.Reason,
        });

        messages.push({ to: body.adminmail || adminEmail, ...t.admin });
        if (t.senapati && body.sanapatimail) messages.push({ to: body.sanapatimail, ...t.senapati });
        break;
      }

      case "test_mail": {
        const t = getTestMailTemplate();
        messages.push({ to: body.adminmail || adminEmail, ...t });
        break;
      }

      case "test_all_templates": {
        const { getAllTemplatesDigest } = await import("@/lib/emailTemplates");
        const digest = getAllTemplatesDigest();
        messages.push({ to: body.adminmail || adminEmail, ...digest });
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action: " + mailfor }, { status: 400 });
    }

    // Execute SMTP delivery
    await Promise.all(
      messages.map((m) =>
        transporter.sendMail({
          from: senderEmail,
          to: m.to,
          subject: m.subject,
          html: m.html,
          bcc: m.bcc,
        })
      )
    );

    return NextResponse.json({ success: true, count: messages.length });
  } catch (error: any) {
    console.error("Mailer server error:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}