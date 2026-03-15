import { scrapeTodayPrice } from "./scraper.js";
import admin from "firebase-admin";
import { readFileSync } from "fs";

// Init Firebase
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Fetch today's real price
const today = await scrapeTodayPrice();
const base = today.price10g;

// Build 5 days of data based on today's real price
const entries = [
  today,
  { date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0], price10g: Math.round(base * 0.995), price5g: Math.round(base * 0.995 / 2) },
  { date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], price10g: Math.round(base * 1.010), price5g: Math.round(base * 1.010 / 2) },
  { date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], price10g: Math.round(base * 0.980), price5g: Math.round(base * 0.980 / 2) },
  { date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0], price10g: Math.round(base * 1.005), price5g: Math.round(base * 1.005 / 2) },
];

// Write to Firestore
for (const entry of entries) {
  await db.collection("prices").doc(entry.date).set(entry);
  console.log("Seeded:", entry.date, "| 10g: ₹" + entry.price10g.toLocaleString("en-IN"), "| 5g: ₹" + entry.price5g.toLocaleString("en-IN"));
}

console.log("✅ Firestore seeded successfully!");
process.exit(0);
