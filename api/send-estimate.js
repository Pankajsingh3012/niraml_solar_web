const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const readBody = async (request) => {
  if (typeof request.body === "string") {
    return request.body ? JSON.parse(request.body) : {};
  }

  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
};

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = requiredEnv("RESEND_API_KEY");
    const to = process.env.RESEND_TO || "pankajsingh30122001@gmail.com";
    const from = process.env.RESEND_FROM || "onboarding@resend.dev";
    const body = await readBody(request);
    const {
      name = "",
      email = "",
      phone = "",
      property = "",
      load = "",
      message = "",
    } = body;

    if (!name.trim() || !phone.trim()) {
      return response.status(400).json({
        error: "Name and phone are required.",
      });
    }

    const rows = [
      ["Name", name],
      ["Email", email || "Not provided"],
      ["Phone", phone],
      ["Property type", property || "Not selected"],
      ["Required load", load || "Not provided"],
      ["Message", message || "Not provided"],
    ];

    const htmlRows = rows
      .map(
        ([label, value]) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #dbe7ef;font-weight:700;">${escapeHtml(label)}</td>
            <td style="padding:8px 12px;border:1px solid #dbe7ef;">${escapeHtml(value)}</td>
          </tr>
        `
      )
      .join("");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New solar estimate request from ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#08233f;">
            <h2>New solar estimate request</h2>
            <table style="border-collapse:collapse;width:100%;max-width:640px;">
              ${htmlRows}
            </table>
          </div>
        `,
      }),
    });

    const payload = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      return response.status(502).json({
        error: payload.message || "Email service failed.",
      });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(500).json({
      error: error.message || "Unable to send estimate request.",
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
