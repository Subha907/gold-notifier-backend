import express from "express";
import cors from "cors";
import cron from "node-cron";
import axios from "axios";
import { scrapeTodayPrice } from "./scraper.js";
import { addTodayPrice, getLast5, saveToken, getToken, getPendingNotifications, clearPendingNotifications } from "./history.js";
import { checkAndNotify } from "./notify.js";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

let fcmToken = process.env.FCM_TOKEN || "";

async function loadToken() {
  const saved = await getToken();
  if (saved) { fcmToken = saved; console.log("FCM token loaded from Firestore"); }
}

loadToken();

async function fetchAndStore() {
  try {
    const today = await scrapeTodayPrice();
    const history = await addTodayPrice(today);
    console.log("Price updated:", today.date, "| 10g: ₹" + today.price10g.toLocaleString("en-IN"));
    await checkAndNotify(history, fcmToken);
  } catch (err) {
    console.error("Scrape failed:", err.message);
  }
}

// On startup — only fetch and store price, no notification
async function fetchAndStoreQuiet() {
  try {
    const today = await scrapeTodayPrice();
    await addTodayPrice(today);
    console.log("Startup price updated:", today.date, "| 10g: ₹" + today.price10g.toLocaleString("en-IN"));
  } catch (err) {
    console.error("Scrape failed:", err.message);
  }
}

fetchAndStoreQuiet();

// Every day at 10 AM IST (4:30 AM UTC)
cron.schedule("30 4 * * *", fetchAndStore);

// TEST: one-time notification at 1:25 AM IST (7:55 PM UTC)
cron.schedule("55 19 * * *", async () => {
  console.log("Test notification firing...");
  await fetchAndStore();
}, { scheduled: true, timezone: "UTC" });

// Keep Render free tier awake — ping every 14 mins
cron.schedule("*/14 * * * *", async () => {
  const url = process.env.RENDER_URL;
  if (url) {
    try {
      await axios.get(url);
      console.log("Keep-alive ping sent:", new Date().toISOString());
    } catch (err) {
      console.warn("Keep-alive ping failed:", err.message);
    }
  } else {
    console.warn("RENDER_URL not set, keep-alive skipped");
  }
});

// Manual test notification endpoint
app.get("/api/test-notify", async (req, res) => {
  try {
    await loadToken();
    if (!fcmToken) return res.json({ success: false, message: "No FCM token found" });
    const { sendNotification } = await import("./notify.js");
    await sendNotification(fcmToken, "🧪 Test Notification", `Gold app is working! Time: ${new Date().toLocaleTimeString("en-IN")}`);
    res.json({ success: true, message: "Test notification sent!" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get("/api/prices", async (req, res) => {
  res.json(await getLast5());
});

app.post("/api/token", async (req, res) => {
  const { token } = req.body;
  if (token) {
    fcmToken = token;
    await saveToken(token);
    console.log("FCM token saved to Firestore");
  }
  res.json({ success: true });
});

app.get("/api/notifications", async (req, res) => {
  const notifications = await getPendingNotifications();
  await clearPendingNotifications();
  res.json(notifications);
});

app.get("/api/refresh", async (req, res) => {
  await fetchAndStore();
  res.json(await getLast5());
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
