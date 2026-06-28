import express, { urlencoded, json } from "express"
import cors from "cors"
import { Resend } from "resend"

const port = process.env.PORT || 3000

const app = express()
const resend = new Resend(process.env.RESEND_API_KEY)



app.use(cors())
app.use(json())
app.use(urlencoded({ extended: false }))

app.get("/", (req, res)=>{
  res.status(200).send("Success")
})


app.post("/", async (req, res, next) => {

    const { firstName, lastName, email, company, title, accessTime } = req.body

    try {
        const response = await resend.emails.send({
            from: "Acacia Notifications <onboarding@resend.dev>",
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
            <td
              style="
                background:#14532d;
                color:#ffffff;
                padding:24px 32px;
              "
            >
              <h1
                style="
                  margin:0;
                  font-size:24px;
                  font-weight:600;
                "
              >
                🌍 New Dashboard Visitor
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p
                style="
                  margin:0 0 24px;
                  font-size:16px;
                  line-height:1.6;
                "
              >
                A new visitor has been granted access to the
                <strong>Global Historical Agrivoltaic Project Dashboard</strong>.
              </p>

              <h2
                style="
                  margin:0 0 16px;
                  font-size:18px;
                  color:#14532d;
                "
              >
                Visitor Details
              </h2>

              <table
                width="100%"
                cellspacing="0"
                cellpadding="12"
                style="
                  border:1px solid #e5e7eb;
                  border-radius:8px;
                "
              >
                <tr>
                  <td style="font-weight:bold;width:180px;">Name</td>
                  <td>${firstName} ${lastName}</td>
                </tr>

                <tr style="background:#fafafa;">
                  <td style="font-weight:bold;">Organization</td>
                  <td>${company}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Job Title</td>
                  <td>${title}</td>
                </tr>

                <tr style="background:#fafafa;">
                  <td style="font-weight:bold;">Email</td>
                  <td>
                    <a
                      href="mailto:${email}"
                      style="color:#14532d;text-decoration:none;"
                    >
                      ${email}
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="font-weight:bold;">Access Time</td>
                  <td>${new Date(accessTime).toLocaleString()}</td>
                </tr>
              </table>

              <p
                style="
                  margin:32px 0 0;
                  font-size:14px;
                  color:#6b7280;
                  line-height:1.6;
                "
              >
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
`
        });
        console.log(response)
        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message })
    }

})


if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
