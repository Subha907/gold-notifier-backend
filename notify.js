import admin from "firebase-admin";
import { savePendingNotifications } from "./history.js";

export async function sendNotification(token, title, body) {
  try {
    await admin.messaging().send({ token, notification: { title, body } });
  } catch (err) {
    console.warn("FCM send failed:", err.message);
  }
}

export async function checkAndNotify(prices, token) {
  if (prices.length < 2) return;

  const today = prices[0];
  const yesterday = prices[1];
  const change = ((today.price10g - yesterday.price10g) / yesterday.price10g) * 100;

  const notifications = [];

  // Always add daily morning update
  notifications.push({
    title: "🪙 Daily Gold Price Update",
    body: `24K Gold in Kolkata — 10g: ₹${today.price10g.toLocaleString("en-IN")} | 5g: ₹${today.price5g.toLocaleString("en-IN")}`,
  });

  // Significant change alert (±1.5%)
  if (Math.abs(change) >= 1.5) {
    const direction = change > 0 ? "📈 UP" : "📉 DOWN";
    notifications.push({
      title: `Gold Price Alert ${direction}`,
      body: `24K Gold is ${direction} by ${Math.abs(change).toFixed(2)}% vs yesterday. Today: ₹${today.price10g.toLocaleString("en-IN")}/10g`,
    });
  }

  // Target range alert for 5g between ₹60,000–₹70,000
  if (today.price5g >= 60000 && today.price5g <= 70000) {
    notifications.push({
      title: "🎯 Gold Target Range Hit!",
      body: `5g 24K Gold is ₹${today.price5g.toLocaleString("en-IN")} — within your target range of ₹60,000–₹70,000!`,
    });
  }

  // Save to Firestore (for offline delivery when user comes online)
  await savePendingNotifications(notifications);

  // Also try FCM push (works if phone is online)
  if (token) {
    for (const n of notifications) {
      await sendNotification(token, n.title, n.body);
    }
  }
}
