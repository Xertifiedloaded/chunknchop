const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";

export async function sendWaitlistEmail(name: string, to: string) {
  const {
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
    EMAILJS_PRIVATE_KEY,
  } = process.env;

  if (
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY ||
    !EMAILJS_PRIVATE_KEY
  ) {
    throw new Error("EmailJS environment variables are missing.");
  }

  const recipient = to?.trim();
  if (!recipient) {
    throw new Error("sendWaitlistEmail called with an empty recipient.");
  }

  const res = await fetch(EMAILJS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        name,
        to_name: name,
        to_email: recipient,
        email: recipient,
        reply_to: recipient,
        subject: "You're on the ChunkNChop waitlist",
        message:
          "Thanks for joining the waitlist. We'll email you first about launch day and opening offers.",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`EmailJS failed (${res.status}): ${await res.text()}`);
  }
}