import express, { urlencoded, json } from "express"
import cors from "cors"
import { Resend } from "resend"

const port = process.env.PORT || 3000

const app = express()
const resend = new Resend(process.env.RESEND_API_KEY)

// Optional: set ALLOWED_ORIGIN (comma-separated) to restrict CORS to your site(s),
// e.g. "https://www.acacia-climate.com,https://acacia-climate-partners.design.webflow.com"
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
  : null

app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined))
app.use(json({ limit: "10kb" }))
app.use(urlencoded({ extended: false }))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Must match the titles in the front-end GATED object exactly
const ALLOWED_DOCUMENTS = new Set([
  "Agrivoltaics Has Left the Lab: The Global Evidence Base",
  "Leveraging Securitizations to Attract Private Investment to Africa's Agri-food Systems",
])

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const NAME_RE = /^(?=.*\p{L})[\p{L}’' \-]{2,50}$/u
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Free text (job title, company): 2-100 characters, no control characters
const TEXT_RE = /^[^\p{C}]{2,100}$/u

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.status(200).send("Success")
})

// Dashboard access notification (unchanged behaviour, with escaping)
app.post("/", async (req, res) => {
  const { firstName, lastName, email, company, title, accessTime } = req.body ?? {}

  const safe = {
    firstName: escapeHtml(firstName),
    lastName: escapeHtml(lastName),
    email: escapeHtml(email),
    company: escapeHtml(company),
    title: escapeHtml(title),
  }

  try {
    const response = await resend.emails.send({
      from: "Acacia Notifications <info@acacia-climate.com>",
      to: process.env.CLIENT,
      subject: "New Dashboard Access",
      html: `
<html lang="en">
<head>
  <meta charset="UTF-8" />
</head>
<body style="margin:0;padding:40px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#333;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="600"
          cellspacing="0"
          cellpadding="0"
          style="
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 2px 10px rgba(0,0,0,.08);
          "
        >
          <tr>
            <td style="background:#14532d;color:#ffffff;padding:24px 32px;">
              <h1 style="margin:0;font-size:24px;font-weight:600;">
                🌍 New Dashboard Visitor
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                A new visitor has been granted access to the
                <strong>Global Historical Agrivoltaic Project Dashboard</strong>.
              </p>

              <h2 style="margin:0 0 16px;font-size:18px;color:#14532d;">
                Visitor Details
              </h2>

              <table
                width="100%"
                cellspacing="0"
                cellpadding="12"
                style="border:1px solid #e5e7eb;border-radius:8px;"
              >
                <tr>
                  <td style="font-weight:bold;width:180px;">Name</td>
                  <td>${safe.firstName} ${safe.lastName}</td>
                </tr>

                <tr style="background:#fafafa;">
                  <td style="font-weight:bold;">Organization</td>
                  <td>${safe.company}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Job Title</td>
                  <td>${safe.title}</td>
                </tr>

                <tr style="background:#fafafa;">
                  <td style="font-weight:bold;">Email</td>
                  <td>
                    <a href="mailto:${safe.email}" style="color:#14532d;text-decoration:none;">
                      ${safe.email}
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Access Time</td>
                  <td>${accessTime ? escapeHtml(new Date(accessTime).toLocaleString()) : new Date().toLocaleString()}</td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                This notification was generated automatically by the
                <strong>Global Historical Agrivoltaic Project Dashboard</strong>
                access system after the visitor successfully submitted the access
                form.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              style="
                background:#f9fafb;
                padding:20px 32px;
                text-align:center;
                font-size:13px;
                color:#9ca3af;
              "
            >
              Acacia Climate • Dashboard Access Notification
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`,
    })
    console.log(response)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Could not send notification" })
  }
})

// Gated PDF downloads (Data Brief, Blended Finance Market Insights, ...)
app.post("/data-brief", async (req, res) => {
  const {
    firstName,
    lastName,
    title,
    company,
    email,
    document: documentTitle,
  } = req.body ?? {}

  // Server-side validation (client-side checks can be bypassed)
  if (
    !NAME_RE.test(firstName ?? "") ||
    !NAME_RE.test(lastName ?? "") ||
    !TEXT_RE.test(String(title ?? "").trim()) ||
    !TEXT_RE.test(String(company ?? "").trim()) ||
    !EMAIL_RE.test(email ?? "") ||
    String(email).length > 254
  ) {
    return res.status(400).json({ success: false, error: "Invalid input" })
  }

  if (!ALLOWED_DOCUMENTS.has(documentTitle)) {
    return res.status(400).json({ success: false, error: "Unknown document" })
  }

  const safe = {
    firstName: escapeHtml(firstName),
    lastName: escapeHtml(lastName),
    title: escapeHtml(String(title).trim()),
    company: escapeHtml(String(company).trim()),
    email: escapeHtml(email),
    document: escapeHtml(documentTitle),
  }
  const accessTime = new Date().toUTCString() // server-side timestamp

  try {
    await resend.emails.send({
      from: "Acacia Notifications <info@acacia-climate.com>",
      to: process.env.CLIENT, // was process.env.TEST
      subject: `New Download: ${documentTitle}`,
      html: `
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:40px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#14532d;color:#ffffff;padding:24px 32px;">
              <h1 style="margin:0;font-size:24px;font-weight:600;">🌍 New Download</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:18px;color:#14532d;">Visitor Details</h2>
              <table width="100%" cellspacing="0" cellpadding="12"
                style="border:1px solid #e5e7eb;border-radius:8px;">
                <tr>
                  <td style="font-weight:bold;width:180px;">Document</td>
                  <td>${safe.document}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="font-weight:bold;">Name</td>
                  <td>${safe.firstName} ${safe.lastName}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold;">Title</td>
                  <td>${safe.title}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="font-weight:bold;">Company</td>
                  <td>${safe.company}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold;">Email</td>
                  <td>
                    <a href="mailto:${safe.email}" style="color:#14532d;text-decoration:none;">${safe.email}</a>
                  </td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="font-weight:bold;">Access Time</td>
                  <td>${accessTime}</td>
                </tr>
              </table>
              <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                This notification was generated automatically by the
                <strong>Acacia-climate</strong> access system after the visitor
                submitted the download form. The email address has not been verified.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;font-size:13px;color:#9ca3af;">
              Acacia Climate • Download Notification
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: "Could not send notification" })
  }
})

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

export default app