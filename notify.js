import admin from "firebase-admin";

export async function sendNotification(token, title, body) {
  await admin.messaging().send({ token, notification: { title, body } });
}

export async function checkAndNotify(prices, token) {
  if (!token || prices.length < 2) return;

  const today = prices[0];
  const yesterday = prices[1];
  const change = ((today.price10g - yesterday.price10g) / yesterday.price10g) * 100;

  // Significant change alert (±1.5%)
  if (Math.abs(change) >= 1.5) {
    const direction = change > 0 ? "📈 UP" : "📉 DOWN";
    await sendNotification(
      token,
      `Gold Price Alert ${direction}`,
      `24K Gold in Kolkata is ${direction} by ${Math.abs(change).toFixed(2)}%. Today: ₹${today.price10g.toLocaleString("en-IN")}/10g`
    );
  }

  // Target range alert for 5g between ₹60,000–₹70,000
  if (today.price5g >= 60000 && today.price5g <= 70000) {
    await sendNotification(
      token,
      "🎯 Gold Target Range Hit!",
      `5g 24K Gold is ₹${today.price5g.toLocaleString("en-IN")} — within your target range of ₹60,000–₹70,000!`
    );
  }
}
