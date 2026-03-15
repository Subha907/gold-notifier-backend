import express from "express";
import cors from "cors";
import cron from "node-cron";
import { scrapeTodayPrice } from "./scraper.js";
import { addTodayPrice, getLast5 } from "./history.js";
import { checkAndNotify } from "./notify.js";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

let fcmToken = process.env.FCM_TOKEN || "";

async function fetchAndStore() {
  try {
    const today = await scrapeTodayPrice();
    const history = addTodayPrice(today);
    console.log("Price updated:", today.date, "| 10g: ₹" + today.price10g.toLocaleString("en-IN"));
    await checkAndNotify(history, fcmToken);
  } catch (err) {
    console.error("Scrape failed:", err.message);
  }
}

fetchAndStore();

// Every day at 9 AM IST (3:30 AM UTC)
cron.schedule("30 3 * * *", fetchAndStore);

app.get("/api/prices", (req, res) => {
  res.json(getLast5());
});

app.post("/api/token", (req, res) => {
  const { token } = req.body;
  if (token) { fcmToken = token; console.log("FCM token saved"); }
  res.json({ success: true });
});

app.get("/api/refresh", async (req, res) => {
  await fetchAndStore();
  res.json(getLast5());
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
