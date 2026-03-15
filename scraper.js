import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.google.com/",
};

export async function scrapeTodayPrice() {
  const { data } = await axios.get("https://www.bankbazaar.com/gold-rate-kolkata.html", { headers: HEADERS });
  const $ = cheerio.load(data);

  // Table index 2 has daily 24K prices (8g column = col index 2)
  const firstRow = $("table").eq(2).find("tr").eq(1); // eq(0) is header
  const dateText = $(firstRow).find("td").eq(0).text().trim();
  const price8gRaw = $(firstRow).find("td").eq(2).text();
  // Extract number before the bracket e.g. "₹ 1,24,192(0)" → 124192
  const price8g = parseInt(price8gRaw.split("(")[0].replace(/[^0-9]/g, ""));
  if (isNaN(price8g)) throw new Error("Could not parse today's gold price");

  const price1g = Math.round(price8g / 8);
  const date = new Date().toISOString().split("T")[0];

  return { date, price10g: price1g * 10, price5g: price1g * 5 };
}
