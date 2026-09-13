// src/lib/emailTemplates.ts

export interface EmailTemplateResult {
  subject: string;
  html: string;
  bcc?: string;
}

// 1. Website Booking Notifications
export function getBookAartiTemplates(payload: {
  hostname: string;
  hostmail?: string;
  mobile: string;
  emirate: string;
  area?: string;
  landmark?: string;
  address: string;
  date: string;
  time: string;
  sanname?: string;
  sanapatimail?: string;
  adminmail: string;
}): { host?: EmailTemplateResult; admin: EmailTemplateResult; senapati?: EmailTemplateResult } {
  const sanname = payload.sanname || "Select preferred Devotee";
  const datetime = ` ${payload.date}, ${payload.time}`;
  const fullAddress = `${payload.address} ,near ${payload.landmark || ""} , ${payload.area || ""}, ${payload.emirate}</h3>`;

  const adminadditioninfo = sanname === "Select preferred Devotee" ? "Allocation requried" : sanname;
  const admin: EmailTemplateResult = {
    subject: " New Damodara Arati booked",
    html: `Dear Admin,<br><br>Hare Krishna!<br><br>A new Damodara Arati booking has been made:<br><br><b>Host Name: ${payload.hostname}</b><br><b>Host Address: ${fullAddress}</b><br> <b>Host Contact: ${payload.mobile} and ${payload.hostmail || ""}</b><br><b>Allocated Senapati: ${adminadditioninfo}</b><br><b>Selected Date Time: ${datetime}</b><br><br>Your humble servant<br>DDY Seva Team`,
  };

  const additioninfo = sanname.includes("Select") ? "" : `<b>Allocated Senapati: ${sanname}</b>`;
  const host: EmailTemplateResult | undefined = payload.hostmail
    ? {
        subject: "New Damodara Arati booking",
        html: `Dear ${payload.hostname},<br><br>Hare Krishna!<br><br>Please accept my humble obeisances.<br><br>All Glories to Srila Prabhupada.<br><br>Thanks a lot for your interest in conducting Damodar Arati at your house.<br>Please find below details of the arati booking:<br><br> <b>Name : ${payload.hostname}</b><br> <b>Address : ${fullAddress}</b><br> <b>Contact : ${payload.mobile} and ${payload.hostmail}</b><br><b>Selected Date Time : ${datetime}</b><br>${additioninfo}<br><br>Our representatives will be in touch with you soon to plan the Arati and confirm your booking.<br><br>Please contact us on <b><a style='color:blue' href='https://mail.google.com/mail/?view=cm&fs=1&to=damodar.arati@gmail.com'>damodar.arati@gmail.com</a></b> or WhatsApp us on <b><a style='color:blue' href='https://wa.me/971567797901'>+971567797901</a></b> for further queries.<br><br>Your humble servant<br><br>DDY Seva Team`,
      }
    : undefined;

  const senapati: EmailTemplateResult | undefined =
    sanname !== "Select preferred Devotee" && payload.sanapatimail
      ? {
          subject: "New Damodara Arati booked",
          html: `<p>Dear  ${sanname},<p><br>You have been booked to conduct Damodara Arati on <b>${datetime}</b> for <b>${payload.hostname}</b> at <b>${fullAddress}</b>Mobile no ${payload.mobile}.<br><br>To reject conducting this Arati, please login your Senapati Account on iskcondamodardesh.com.<br><br>Hare Krishna!`,
          bcc: "bhaskarthedeveloper@gmail.com",
        }
      : undefined;

  return { host, admin, senapati };
}

// 2. Senapati Registration
export function getNewUserTemplates(payload: {
  sanname: string;
  email: string;
  mobile: string;
  whatsapp?: string;
  area: string;
  emirate: string;
}): { applicant: EmailTemplateResult; admin: EmailTemplateResult } {
  const address = ` ${payload.area}, ${payload.emirate}`;

  return {
    applicant: {
      subject: "senapti registeration request sent",
      html: ` <p >Dear ${payload.sanname},</p>Your request for senapati seva has sent to admin. You will receive confirmation mail post admin approval.<br>Below are the details of your registeration:<br><b>Name :</b> ${payload.sanname}<br><b>Address :</b> ${address}<br><b>Mobile :</b> ${payload.mobile}<br> <b>WhatsApp :</b>${payload.whatsapp || ""}<br><b>Email :</b>${payload.email}<br><br> Hare Krishna!`,
      bcc: "bhaskarthedeveloper@gmail.com",
    },
    admin: {
      subject: "request for senapti registeration",
      html: `<p>Dear Admin</p> <b>${payload.sanname}</b> has just registered for senapati seva, with below details:<br><b>Area availability: </b>${payload.area}<br>contact him on <b>${payload.mobile}</b>(mobile), <b>${payload.whatsapp || ""}</b>(WhatsApp) or via <b>${payload.email}</b>. <br><br>To approve or reject his request please login to https://iskcondamodardesh.com/admin `,
      bcc: "bhaskarthedeveloper@gmail.com",
    },
  };
}

// 3. Completed Aarti Report
export function getReportAartiTemplates(payload: {
  sanname: string;
  hostname: string;
  hostmail?: string;
  isregister?: string;
  address: string;
  date?: string;
  time?: string;
}): { admin: EmailTemplateResult; host?: EmailTemplateResult } {
  const datetime = ` ${payload.date || ""}, ${payload.time || ""}`;
  const isregistered = payload.isregister ?? "Yes";

  const admin: EmailTemplateResult = {
    subject: "Completed Damodara Arati reported",
    html: `Dear Admin,<br><br><b>${payload.sanname}</b> has reported a <i>completed Damoadara Arati</i> with the below details:<br><b>Registered Host :</b> ${isregistered}<br><b>Host Name :</b>${payload.hostname} (${payload.hostmail || ""})<br><b>Host Address :</b>${payload.address}<br><br> Hare Krishna!`,
    bcc: "bhaskarthedeveloper@gmail.com",
  };

  const host: EmailTemplateResult | undefined =
    payload.hostmail && payload.hostmail.includes("@")
      ? {
          subject: "Thank You for Hosting Damodara Arati",
          html: `Dear ${payload.hostname},<br><br>Hare Krishna!<br><br>Please accept my humble obeisances.<br><br>All Glories to Srila Prabhupada.<br><br>Thank you very much for inviting Lord Damodara to your home and hosting the sacred Damodara Arati with your family and guests. Offering ghee lamps and singing the glories of Lord Damodara during this auspicious Karthika month brings immense spiritual benefit and auspiciousness to everyone present.<br><br>Our Sevadhari <b>${payload.sanname}</b> has submitted the report for the Arati conducted at your residence on <b>${datetime}</b>.<br><br>We hope this program brought peace, joy, and devotion to your household. You can also book future home Aartis and stay connected with us through our website at <a style='color:blue' href='https://iskcondamodardesh.com/'>https://iskcondamodardesh.com/</a>.<br><br>Please contact us on <b><a style='color:blue' href='https://mail.google.com/mail/?view=cm&fs=1&to=damodar.arati@gmail.com'>damodar.arati@gmail.com</a></b> or WhatsApp us on <b><a style='color:blue' href='https://wa.me/971567797901'>+971567797901</a></b> for further queries.<br><br>Your humble servant<br><br>DDY Seva Team`,
          bcc: "bhaskarthedeveloper@gmail.com",
        }
      : undefined;

  return { admin, host };
}

// 4. Direct Offline Aarti Report
export function getDirectOfflineAartiTemplates(payload: {
  sanname: string;
  hostname: string;
  hostmail?: string;
  address: string;
  date?: string;
  time?: string;
}): { admin: EmailTemplateResult; host?: EmailTemplateResult } {
  const datetime = ` ${payload.date || ""}, ${payload.time || ""}`;

  const admin: EmailTemplateResult = {
    subject: "Direct Offline Damodara Arati reported",
    html: `Dear Admin,<br><br><b>${payload.sanname}</b> has reported a <i>direct offline Damoadara Arati</i> with the below details:<br><b>Registered Host :</b> No (Direct Offline Report)<br><b>Host Name :</b>${payload.hostname} (${payload.hostmail || ""})<br><b>Host Address :</b>${payload.address}<br><br> Hare Krishna!`,
    bcc: "bhaskarthedeveloper@gmail.com",
  };

  const host: EmailTemplateResult | undefined =
    payload.hostmail && payload.hostmail.includes("@")
      ? {
          subject: "Damodara Arati Participation Confirmation",
          html: `Dear ${payload.hostname},<br><br>Hare Krishna!<br><br>Please accept my humble obeisances.<br><br>All Glories to Srila Prabhupada.<br><br>Thank you very much for participating in the home Damodara Arati conducted by our Sevadhari <b>${payload.sanname}</b> on <b>${datetime}</b> at your residence.<br><br>Offering lamps to Lord Damodara during the auspicious Karthika month brings boundless spiritual merit to all who participate. For future programs, you can also book your preferred date and slot directly on our website: <a style='color:blue' href='https://iskcondamodardesh.com/book-aarti'>https://iskcondamodardesh.com/book-aarti</a>.<br><br>Please contact us on <b><a style='color:blue' href='https://mail.google.com/mail/?view=cm&fs=1&to=damodar.arati@gmail.com'>damodar.arati@gmail.com</a></b> or WhatsApp us on <b><a style='color:blue' href='https://wa.me/971567797901'>+971567797901</a></b> for further queries.<br><br>Your humble servant<br><br>DDY Seva Team`,
          bcc: "bhaskarthedeveloper@gmail.com",
        }
      : undefined;

  return { admin, host };
}

// 5. Get Connected Outreach
export function getConnectFormTemplates(payload: {
  name: string;
  mobile: string;
  email?: string;
}): { admin: EmailTemplateResult; user?: EmailTemplateResult } {
  return {
    admin: {
      subject: "iskcondamodardesh.com -get connected notification",
      html: `<p>Dear Admin,</p> <b>${payload.name}</b> with <b>${payload.mobile}</b> wants to stay in touch with us.<br>Login to see full details.`,
      bcc: "bhaskarthedeveloper@gmail.com",
    },
    user: payload.email
      ? {
          subject: "New get connected Request",
          html: `Dear ${payload.name},<br><br> Your get connected requested has been submitted to us.<br><br> Thank you.<br>Hare Krishna!`,
          bcc: "bhaskarthedeveloper@gmail.com",
        }
      : undefined,
  };
}

// 6. Devotee Allocation
export function getAllocationTemplates(payload: {
  hostname: string;
  hostmail?: string;
  sanname: string;
  sanapatimail?: string;
  mobile: string;
  date: string;
  time: string;
  address: string;
  landmark?: string;
  area?: string;
  emirate: string;
}): { admin: EmailTemplateResult; senapati?: EmailTemplateResult; host?: EmailTemplateResult } {
  const datetime = ` ${payload.date}, ${payload.time}`;
  const fullAddress = `${payload.address} ,near ${payload.landmark || ""} , ${payload.area || ""}, ${payload.emirate}`;

  const admin: EmailTemplateResult = {
    subject: "New Damodara Arati booked on your name",
    html: `Dear Admin,<br><br><b>${payload.sanname}</b> has been assigned a Damodara Arati request with below details:<br><b>Host name:</b> ${payload.hostname}<br><b>Arati date n time:</b> ${datetime}<br><b>Address:</b> ${fullAddress}<br><b>Contact Details:</b> ${payload.mobile}, ${payload.hostmail || ""}<br><br>Thank you.<br>Hare Krishna!`,
    bcc: "bhaskarthedeveloper@gmail.com",
  };

  const senapati: EmailTemplateResult | undefined = payload.sanapatimail
    ? {
        subject: "aarti booked on your name",
        html: `Dear ${payload.sanname},<br><br>Hare Krishna!<br><br>Please accept my humble obeisances.<br><br>All Glories to Srila Prabhupada.<br><br>Please be informed that a Damodar Arati has been allocated to you with below details:<br><br><b>Host Name: ${payload.hostname}</b><br><b>Host Address: ${fullAddress}</b><br> <b>Host Contact: ${payload.mobile} and ${payload.hostmail || ""}</b><br><b>Arati Date and Time: ${datetime}</b><br><br>If you are unable to conduct the arati on the allocated date and time, kindly login to your Senapati account and reject the arati for us to reallocate the same.<br><a style='color:blue' href='https://iskcondamodardesh.com/login'>https://iskcondamodardesh.com/login</a><br><br>Your humble servant<br><br>DDY Seva Team`,
        bcc: "bhaskarthedeveloper@gmail.com",
      }
    : undefined;

  const host: EmailTemplateResult | undefined = payload.hostmail
    ? {
        subject: "Damodara Arati allocation",
        html: `Dear ${payload.hostname},<br><br>Hare Krishna!<br><br>Please accept my humble obeisances.<br><br>All Glories to Srila Prabhupada.<br><br>We are pleased to inform that your request for conducting Damodar Arati at your house is now confirmed.<br><br>Following Senapati has now been assigned and will be conducting the Programme and guiding you in the preparation.<br><br> <b>Senapati Name: ${payload.sanname}</b><br><br>Updated Arati details are as below:<br><br> <b>Name : ${payload.hostname}</b><br><b>Arati date and time : ${datetime}</b><br> <b>Address : ${fullAddress}</b><br> <b>Contact Details : ${payload.mobile} and ${payload.hostmail}</b><br><br>The allocated Senapati will also be in touch with you soon or you may reach out to him/her on the number provided above.<br><br>You may also contact us on <b><a style='color:blue' href='https://mail.google.com/mail/?view=cm&fs=1&to=damodar.arati@gmail.com'>damodar.arati@gmail.com</a></b> or WhatsApp us on <b><a style='color:blue' href='https://wa.me/971567797901'>+971567797901</a></b> for  any further queries.<br><br>Your humble servant<br><br>DDY Seva Team`,
        bcc: "bhaskarthedeveloper@gmail.com",
      }
    : undefined;

  return { admin, senapati, host };
}

// 7. Booking Cancelled
export function getCancelledTemplates(payload: {
  hostname: string;
  hostmail?: string;
  sanname: string;
  sanapatimail?: string;
  mobile: string;
  date: string;
  time: string;
  address: string;
  landmark?: string;
  area?: string;
  emirate: string;
  reason?: string;
}): { admin: EmailTemplateResult; senapati?: EmailTemplateResult; host?: EmailTemplateResult } {
  const datetime = ` ${payload.date}, ${payload.time}`;
  const fullAddress = `${payload.address} ,near ${payload.landmark || ""} , ${payload.area || ""}, ${payload.emirate}`;

  const admin: EmailTemplateResult = {
    subject: "Booked Damodara Arati - cancelled",
    html: `Dear Admin,<br><br>Hare Krishna!<br><br>Please accept my humble obeisances.<br><br>All Glories to Srila Prabhupada.<br><br>${payload.sanname} has rejected the below arati allocation.<br><br>Arati details are:<br><b>Host Name: ${payload.hostname}</b><br><b>Host Address: ${fullAddress}</b><br> <b>Host Contact: ${payload.mobile} and ${payload.hostmail || ""}</b><br><b>Arati Date Time: ${datetime}</b><br><b>Reason for rejection: ${payload.reason || ""}</b><br><br>Kindly re-allocate the arati to another Senapati by signing into your admin account.<br><a style='color:blue' href='https://iskcondamodardesh.com/admin'>https://iskcondamodardesh.com/admin</a><br><br>Your humble servant<br><br>DDY Seva Team`,
    bcc: "bhaskarthedeveloper@gmail.com",
  };

  const senapati: EmailTemplateResult | undefined = payload.sanapatimail
    ? {
        subject: "Booked Damodara Arati - cancelled",
        html: `Dear Senapati,<br><br>A Damodara Aarti which was booked and allocated to you has been cancelled. Below are the details for the same:<br><b>Host name :</b> ${payload.hostname}<br><b>Arati date and time :</b> ${datetime}<br><b>Address :</b> ${fullAddress}.<br><b>Contact details :</b> ${payload.mobile}, ${payload.hostmail || ""}<br><br>Hare Krishna!`,
        bcc: "bhaskarthedeveloper@gmail.com",
      }
    : undefined;

  const host: EmailTemplateResult | undefined = payload.hostmail
    ? {
        subject: "Booked Damodara Arati - cancelled",
        html: `Dear ${payload.hostname},<br><br>Hare Krishna!<br><br>Please accept my humble obeisances.<br><br>All Glories to Srila Prabhupada.<br><br>Unfortunately, we are unable to confirm a devotee to conduct Arati on the below preferred date and time.<br><br><b>Arati date and time : ${datetime}</b><br> <b>Address : ${fullAddress}</b><br> <b>Contact Details : ${payload.mobile} and ${payload.hostmail}</b><br><br>You may rebook the Arati on a different date and time through the below link.<br><a style='color:blue' href='https://iskcondamodardesh.com/book-aarti'>https://iskcondamodardesh.com/book-aarti</a> <br><br>Should you need any further assistance, kindly connect with us on <b><a style='color:blue' href='https://mail.google.com/mail/?view=cm&fs=1&to=damodar.arati@gmail.com'>damodar.arati@gmail.com</a></b> or WhatsApp on <b><a style='color:blue' href='https://wa.me/971567797901'>+971567797901</a></b><br><br>Your humble servant<br><br>DDY Seva Team`,
      }
    : undefined;

  return { admin, senapati, host };
}

// 8. Senapati Approval/Rejection Action
export function getRequestActionTemplates(payload: {
  sanname: string;
  status: string;
  reason?: string;
  mobile: string;
  sanapatimail: string;
}): { applicant: EmailTemplateResult; admin: EmailTemplateResult } {
  const isApproved = payload.status === "Approved" || payload.status === "approved";
  const statusmess = isApproved ? "accpeted" : "rejected";

  const saninfoapproved = `Dear ${payload.sanname},<br><br>Hare Krishna!<br><br>Please accept my humble obeisances.<br><br>All Glories to Srila Prabhupada.<br><br>Your request for Damodara Senapati seva has been <b>${payload.status}</b><br><br>You may now <b>login to the Senapati portal</b> using below link to update your availability and manage/report your aratis.<br><a style='color:blue' href='https://iskcondamodardesh.com/login'>https://iskcondamodardesh.com/login</a><br><br>Also join us on the below Senapati Support WhatsApp group, to get support and updates during the Karthik month<br><a style='color:blue' href='https://chat.whatsapp.com/GhdUmhLGLxX4yWK8QYsN0J'>https://chat.whatsapp.com/GhdUmhLGLxX4yWK8QYsN0J</a><br><br>Should you have any issues or clarification you can message us on this group.<br><br><b>Note: While reporting Arati's the Token number is your mobile number.</b><br><br>Your humble servant<br><br>DDY Seva Team`;

  const saninforeject = `<b>Your request for Damodara Senapati seva has been <h2>${payload.status} </p></b><br><h3>Reason:- ${payload.reason || ""}</h3><br> Note: Please contact admin for further clarification<br>Thank you.<br>Hare Krishna!`;

  return {
    applicant: {
      subject: `Senapati registration - ${payload.status}`,
      html: isApproved ? saninfoapproved : saninforeject,
      bcc: "bhaskarthedeveloper@gmail.com",
    },
    admin: {
      subject: `Senapati registration - ${payload.status}`,
      html: `<br>Dear Admin,<br>You have ${statusmess} the Senapati registeration request for ${payload.sanname} with mobile no. ${payload.mobile} and email ${payload.sanapatimail}.<br><br>Hare Krishna!`,
      bcc: "bhaskarthedeveloper@gmail.com",
    },
  };
}

// 9. Re-assign Request (Devotee Rejection)
export function getReassignTemplates(payload: {
  sanname: string;
  hostname: string;
  hostmail?: string;
  mobile: string;
  sanapatimail?: string;
  date: string;
  time: string;
  address: string;
  reason?: string;
}): { admin: EmailTemplateResult; senapati?: EmailTemplateResult } {
  const admin: EmailTemplateResult = {
    subject: "New Damodara Arati rejection request",
    html: `Dear Admin,<br><br><b>${payload.sanname}</b> has rejected an arati request.Arati details are:<br><b>Host Name: </b>  ${payload.hostname},<br><b>Address: </b> ${payload.address},<br><b>Contact: </b> ${payload.mobile}, ${payload.hostmail || ""}<br><b>Arati date n Time:</b> ${payload.date}, ${payload.time}<br><br><b>Reason from Senapati:</b>${payload.reason || ""}<br><br>Please login to re-allocate this Arati.<br><br>Thank you.<br>Hare Krishna!`,
    bcc: "bhaskarthedeveloper@gmail.com",
  };

  const senapati: EmailTemplateResult | undefined = payload.sanapatimail
    ? {
        subject: "New Damodara Arati rejection request",
        html: `Dear Senapati,<br><br>You have rejected a Damodara Arati request with below details: <br><b>Host Name :</b> ${payload.hostname},<br><b>Address:</b>${payload.address},<br><b>Mobile no.:</b> ${payload.mobile},<br><b>Email :</b> ${payload.hostmail || ""}<br><b>Arati date n Time :</b>${payload.date}, ${payload.time}.<br><br>Hare Krishna!`,
        bcc: "bhaskarthedeveloper@gmail.com",
      }
    : undefined;

  return { admin, senapati };
}

// 10. Admin Self-Test
export function getTestMailTemplate(): EmailTemplateResult {
  return {
    subject: "Test Notification: Email Delivery Verified",
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><p>Dear Admin,</p><p>Hare Krishna! Please accept our humble obeisances. All Glories to Srila Prabhupada.</p><p>This is a <b>test email</b> sent from your <b>Admin Portal</b>.</p><p>If you have received this message, the Nodemailer SMTP integration and Google App Password are fully verified and operational.</p><br/><p>Your humble servant<br/><b>DDY Seva Team</b></p></div>`,
  };
}

// 11. all template digest preview
export function getAllTemplatesDigest(): EmailTemplateResult {
  const dummy = {
    hostname: "Host Name",
    hostmail: "host.sample@example.com",
    mobile: "0501234567",
    whatsapp: "+971501234567",
    emirate: "Dubai",
    area: "Bur Dubai",
    landmark: "Near Metro Station",
    address: "Flat 101, Krishna Heights",
    date: "2026-10-25",
    time: "07:00 PM - 08:00 PM",
    sanname: "Senapati Devotee Name",
    sanapatimail: "senapati.sample@example.com",
    adminmail: "admin.sample@example.com",
    status: "Approved",
    reason: "Prior commitment conflict",
    name: "Outreach Contact Name",
  };

  const book = getBookAartiTemplates(dummy);
  const newUser = getNewUserTemplates({
    sanname: dummy.sanname,
    email: dummy.sanapatimail,
    mobile: dummy.mobile,
    whatsapp: dummy.whatsapp,
    area: dummy.area,
    emirate: dummy.emirate,
  });
  const report = getReportAartiTemplates({
    sanname: dummy.sanname,
    hostname: dummy.hostname,
    hostmail: dummy.hostmail,
    isregister: "Yes",
    address: `${dummy.address}, ${dummy.area}, ${dummy.emirate}`,
    date: dummy.date,
    time: dummy.time,
  });
  const directOffline = getDirectOfflineAartiTemplates({
    sanname: dummy.sanname,
    hostname: dummy.hostname,
    hostmail: dummy.hostmail,
    address: `${dummy.address}, ${dummy.area}, ${dummy.emirate}`,
    date: dummy.date,
    time: dummy.time,
  });
  const connect = getConnectFormTemplates({
    name: dummy.name,
    mobile: dummy.mobile,
    email: dummy.hostmail,
  });
  const alloc = getAllocationTemplates(dummy);
  const cancel = getCancelledTemplates({ ...dummy, reason: dummy.reason });
  const reqActionApproved = getRequestActionTemplates({
    sanname: dummy.sanname,
    status: "Approved",
    mobile: dummy.mobile,
    sanapatimail: dummy.sanapatimail,
  });
  const reqActionRejected = getRequestActionTemplates({
    sanname: dummy.sanname,
    status: "Rejected",
    reason: dummy.reason,
    mobile: dummy.mobile,
    sanapatimail: dummy.sanapatimail,
  });
  const reassign = getReassignTemplates({
    sanname: dummy.sanname,
    hostname: dummy.hostname,
    hostmail: dummy.hostmail,
    mobile: dummy.mobile,
    sanapatimail: dummy.sanapatimail,
    date: dummy.date,
    time: dummy.time,
    address: `${dummy.address}, ${dummy.area}, ${dummy.emirate}`,
    reason: dummy.reason,
  });

  const cards = [
    { title: "1. Website Booking - Host Confirmation", ...book.host },
    { title: "2. Website Booking - Admin Notification", ...book.admin },
    { title: "3. Website Booking - Senapati Notification", ...book.senapati },
    { title: "4. Senapati Registration - Applicant Confirmation", ...newUser.applicant },
    { title: "5. Senapati Registration - Admin Notification", ...newUser.admin },
    { title: "6. Completed Aarti Report - Admin Summary", ...report.admin },
    { title: "7. Completed Aarti Report - Host Thank You Receipt", ...report.host },
    { title: "8. Direct Offline Aarti - Admin Summary", ...directOffline.admin },
    { title: "9. Direct Offline Aarti - Host Welcome", ...directOffline.host },
    { title: "10. Get Connected Form - Admin Notification", ...connect.admin },
    { title: "11. Get Connected Form - Submitter Confirmation", ...connect.user },
    { title: "12. Senapati Allocation - Senapati Mail", ...alloc.senapati },
    { title: "13. Senapati Allocation - Admin Notification", ...alloc.admin },
    { title: "14. Senapati Allocation - Host Confirmation", ...alloc.host },
    { title: "15. Booking Cancelled - Admin Notification", ...cancel.admin },
    { title: "16. Booking Cancelled - Senapati Notification", ...cancel.senapati },
    { title: "17. Booking Cancelled - Host Notification", ...cancel.host },
    { title: "18. Senapati Application - Approved Mail", ...reqActionApproved.applicant },
    { title: "19. Senapati Application - Rejected Mail", ...reqActionRejected.applicant },
    { title: "20. Senapati Rejection - Admin Alert", ...reassign.admin },
    { title: "21. Senapati Rejection - Devotee Sender Receipt", ...reassign.senapati },
  ];

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 24px;">
      <div style="max-width: 720px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #cbd5e1;">
        <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #e2e8f0; pb: 12px;">
          📨 All Notification Templates Digest (Sample Preview)
        </h2>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 24px;">
          This email displays every notification template rendered with dummy test data. Verify subjects, layout styling, and hyperlinks.
        </p>

        ${cards
          .filter((c) => c.subject && c.html)
          .map(
            (c) => `
          <div style="margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #1e293b; color: #ffffff; padding: 10px 14px; font-weight: bold; font-size: 12px;">
              ${c.title}
            </div>
            <div style="background: #f8fafc; padding: 8px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155;">
              <b>Subject Line:</b> ${c.subject}
            </div>
            <div style="padding: 16px; background: #ffffff; font-size: 13px; line-height: 1.5;">
              ${c.html}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  return {
    subject: "Preview Digest: All Email Notification Templates",
    html,
  };
}