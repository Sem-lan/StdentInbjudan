import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const osaCollection = collection(db, "osa");

const form = document.getElementById("osa-form");
const status = document.getElementById("osa-status");
const summary = document.getElementById("osa-summary");
const responsesContainer = document.getElementById("osa-responses");

async function loadSummary() {
  try {
    const snapshot = await getDocs(osaCollection);
    let totalGuests = 0;
    const rows = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const count = Number(data.count) || 0;
      totalGuests += count;
      rows.push({ id: doc.id, ...data, count });
    });

    summary.innerHTML = `Senaste OSA: ${rows.length} svar, totalt ${totalGuests} personer.`;

    if (rows.length > 0) {
      responsesContainer.innerHTML = rows
        .map(
          (entry) =>
            `<div class="osa__response"><strong>${escapeHtml(entry.names)}</strong> — ${escapeHtml(
              String(entry.count)
            )} personer<br>Mat: ${escapeHtml(entry.food || "Ingen")}<br>${escapeHtml(
              entry.other || "Ingen extra information"
            )}</div>`
        )
        .join("");
    } else {
      responsesContainer.innerHTML = "Inga svar än. Var först med att skicka din OSA!";
    }
  } catch (error) {
    summary.textContent = "Kunde inte läsa OSA-sammanfattningen. Kontrollera Firestore-konfigurationen.";
    console.error(error);
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const names = document.getElementById("osa-names").value.trim();
  const count = Number(document.getElementById("osa-count").value);
  const food = document.getElementById("osa-food").value.trim();
  const other = document.getElementById("osa-other").value.trim();

  if (!names || count < 1) {
    status.textContent = "Ange namn och minst 1 person.";
    return;
  }

  status.textContent = "Skickar...";

  try {
    await addDoc(osaCollection, {
      names,
      count,
      food,
      other,
      timestamp: serverTimestamp(),
    });

    status.textContent = "Tack! Din OSA är sparad.";
    form.reset();
    document.getElementById("osa-count").value = "1";
    await loadSummary();
  } catch (error) {
    status.textContent = "Det gick inte att skicka. Försök igen senare.";
    console.error(error);
  }
});

loadSummary();
