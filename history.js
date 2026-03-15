import { readFileSync, writeFileSync, existsSync } from "fs";

const FILE = "./priceHistory.json";

function load() {
  if (!existsSync(FILE)) return [];
  return JSON.parse(readFileSync(FILE, "utf8"));
}

function save(history) {
  writeFileSync(FILE, JSON.stringify(history, null, 2));
}

export function addTodayPrice(entry) {
  const history = load();
  // Avoid duplicate for same date
  const exists = history.find((p) => p.date === entry.date);
  if (!exists) {
    history.unshift(entry); // newest first
    save(history);
  }
  return getLast5(history);
}

export function getLast5(history = null) {
  const data = history || load();
  return data
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
}
