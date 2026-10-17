"use client";

import { useEffect } from "react";
import { OFFLINE_WORKER } from "../../config";

// Registers the offline worker in a production build, or unregisters every worker when its switch is off.

export default function OfflineWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    const workers = navigator.serviceWorker;
    if (OFFLINE_WORKER.on) {
      // `none`, so a fixed sw.js reaches a phone on its next visit rather than past an HTTP cache.
      void workers.register(OFFLINE_WORKER.path, { updateViaCache: "none" });
    } else {
      void workers.getRegistrations().then((all) => Promise.all(all.map((registration) => registration.unregister())));
    }
  }, []);
  return null;
}
