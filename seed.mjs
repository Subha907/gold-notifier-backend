import { scrapeTodayPrice } from "./scraper.js";
import { writeFileSync } from "fs";

const today = await scrapeTodayPrice();
const base = today.price10g;

const history = [
  today,
  { date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0], price10g: Math.round(base * 0.995), price5g: Math.round(base * 0.995 / 2) },
  { date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], price10g: Math.round(base * 1.010), price5g: Math.round(base * 1.010 / 2) },
  { date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], price10g: Math.round(base * 0.980), price5g: Math.round(base * 0.980 / 2) },
  { date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0], price10g: Math.round(base * 1.005), price5g: Math.round(base * 1.005 / 2) },
];

writeFileSync("./priceHistory.json", JSON.stringify(history, null, 2));
console.log("Seeded priceHistory.json:");
history.forEach(p => console.log(p.date, "| 10g: ₹" + p.price10g.toLocaleString("en-IN"), "| 5g: ₹" + p.price5g.toLocaleString("en-IN")));
