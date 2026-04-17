/**
 * Firebase Analytics snippet shared by editor.html and index.html.
 * Loaded via gstatic ESM CDN to avoid bundling firebase into the main bundle.
 *
 * Only anonymous page-view / usage events are collected. Diagram content
 * is never sent anywhere — all rendering happens locally in the browser.
 */

export const FIREBASE_SNIPPET = `<!-- Firebase Analytics -->
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDsRwSEX5zzabClsiuUvIRDk7A3DpOauGM",
    authDomain: "beautiful-mermaid.firebaseapp.com",
    projectId: "beautiful-mermaid",
    storageBucket: "beautiful-mermaid.firebasestorage.app",
    messagingSenderId: "25066423050",
    appId: "1:25066423050:web:aa0d1deed69458c7fef0f3",
    measurementId: "G-N823EP61F2"
  };

  try {
    const app = initializeApp(firebaseConfig);
    getAnalytics(app);
  } catch (e) {
    console.warn("Firebase analytics failed to initialize:", e);
  }
</script>`
