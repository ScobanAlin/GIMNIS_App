import { BASE_URL } from "../config";

export async function sendLog(message: string) {
  try {
    await fetch(`${BASE_URL}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    // fallback if server unreachable
    console.log("Failed to send log:", err);
  }
}
