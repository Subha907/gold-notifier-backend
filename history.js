import admin from "firebase-admin";
import { existsSync, readFileSync } from "fs";

let initialized = false;

function getDb() {
  if (!initialized) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
  }
  return admin.firestore();
}

export async function addTodayPrice(entry) {
  const db = getDb();
  const ref = db.collection("prices").doc(entry.date);
  const doc = await ref.get();
  if (!doc.exists) await ref.set(entry);
  return getLast5();
}

export async function getLast5() {
  const db = getDb();
  const snapshot = await db.collection("prices")
    .orderBy("date", "desc")
    .limit(5)
    .get();
  return snapshot.docs.map((d) => d.data());
}
