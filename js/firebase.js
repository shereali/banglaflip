import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEKQK3U7S6jLcZ9PpR79tV4nT5FoIIyeA",
  authDomain: "bangla-reverse-tool.firebaseapp.com",
  projectId: "bangla-reverse-tool",
  storageBucket: "bangla-reverse-tool.appspot.com",
  messagingSenderId: "585564069992",
  appId: "1:585564069992:web:6725087dc428f164ca1bdd",
  measurementId: "G-KBL37R71RN",
};

let app, db;

export function initFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    getAnalytics(app); // Initialize Analytics (not actively used)
    return db;
  } catch (err) {
    console.error("Firebase initialization failed:", {
      code: err.code || "N/A",
      message: err.message || "No error message provided",
      error: JSON.stringify(err, null, 2),
    });
    throw err; // Let caller handle the error
  }
}

export async function logVisitor(toolUsed = null) {
  if (!db) {
    console.error("Cannot log visitor: Firestore not initialized");
    return;
  }
  const referrer = document.referrer || "Direct";
  const timestamp = new Date();
  const userAgent = navigator.userAgent;
  try {
    const visitorPromise = addDoc(collection(db, "visitors"), {
      referrer,
      userAgent,
      toolUsed,
      timestamp: Timestamp.fromDate(timestamp),
    });
    await Promise.race([
      visitorPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore timeout")), 10000)
      ),
    ]);
  } catch (err) {
    console.error("Failed to log visitor:", {
      code: err.code || "N/A",
      message: err.message || "No error message provided",
      error: JSON.stringify(err, null, 2),
    });
    throw err; // Let caller handle the error
  }
}

export async function updateStats(
  totalCountElement,
  todayCountElement,
  usedCountElement,
  animateCounter
) {
  if (!db) {
    console.error("Cannot update stats: Firestore not initialized");
    totalCountElement.innerText = "N/A";
    todayCountElement.innerText = "N/A";
    usedCountElement.innerText = "N/A";
    return;
  }
  try {
    const snapshotPromise = getDocs(collection(db, "visitors"));
    const snapshot = await Promise.race([
      snapshotPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore timeout")), 10000)
      ),
    ]);
    const totalCount = snapshot.size;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySnapshotPromise = getDocs(
      query(
        collection(db, "visitors"),
        where("timestamp", ">=", Timestamp.fromDate(today))
      )
    );
    const todaySnapshot = await Promise.race([
      todaySnapshotPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore timeout")), 10000)
      ),
    ]);
    animateCounter(totalCountElement, totalCount);
    animateCounter(todayCountElement, todaySnapshot.size);
    animateCounter(usedCountElement, todaySnapshot.size);
  } catch (err) {
    console.error("Failed to update stats:", {
      code: err.code || "N/A",
      message: err.message || "No error message provided",
      error: JSON.stringify(err, null, 2),
    });
    totalCountElement.innerText = "N/A";
    todayCountElement.innerText = "N/A";
    usedCountElement.innerText = "N/A";
  }
}

export async function handleShare(
  inputText,
  outputText,
  sharedTooltip,
  reverseWordPreservePunctuation,
  splitter,
  punctuationRegex
) {
  try {
    const input = inputText.value.trim();
    if (!input) {
      alert("শেয়ার করার জন্য কোনো টেক্সট নেই! 😕");
      return;
    }
    const words = input.split(/\s+/);
    const reversedWords = words.map((word) =>
      reverseWordPreservePunctuation(word, splitter, punctuationRegex)
    );
    const reversedText = reversedWords.join(" ");
    if (!db) {
      alert("Firebase সংযোগে সমস্যা 😢। শেয়ার করা যায়নি।");
      return;
    }
    const shareDoc = await addDoc(collection(db, "shares"), {
      inputText: input,
      reversedText: reversedText,
      timestamp: Timestamp.fromDate(new Date()),
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?shareId=${shareDoc.id}`;
    await navigator.clipboard.writeText(shareUrl);
    sharedTooltip.classList.add("opacity-100");
    setTimeout(() => sharedTooltip.classList.remove("opacity-100"), 1500);
  } catch (err) {
    console.error("Share failed:", {
      code: err.code || "N/A",
      message: err.message || "No error message provided",
      error: JSON.stringify(err, null, 2),
    });
    alert("শেয়ার করতে ব্যর্থ! 😢");
  }
}

export async function loadSharedContent(inputText, outputText) {
  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get("shareId");
  if (shareId && db) {
    try {
      const docRef = doc(db, "shares", shareId);
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firestore timeout")), 10000)
        ),
      ]);
      if (docSnap.exists()) {
        const data = docSnap.data();
        inputText.value = data.inputText;
        outputText.textContent = data.reversedText;
      } else {
        alert("শেয়ার করা টেক্সট পাওয়া যায়নি! 😢");
      }
    } catch (err) {
      console.error("Failed to load shared content:", {
        code: err.code || "N/A",
        message: err.message || "No error message provided",
        error: JSON.stringify(err, null, 2),
      });
      alert("শেয়ার করা টেক্সট লোড করতে ব্যর্থ! 😢");
    }
  }
}

export {
  app,
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  Timestamp,
};
