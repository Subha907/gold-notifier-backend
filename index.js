import express from "express";
import cors from "cors";
import cron from "node-cron";
import { scrapeTodayPrice } from "./scraper.js";
import { addTodayPrice, getLast5, saveToken, getToken } from "./history.js";
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

fetchAndStore();

// Every day at 9 AM IST (3:30 AM UTC)
cron.schedule("30 3 * * *", fetchAndStore);

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

app.get("/api/refresh", async (req, res) => {
  await fetchAndStore();
  res.json(await getLast5());
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
