importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// This helps debug if the worker is actually live
self.addEventListener('install', () => {
  self.skipWaiting();
  console.log('OneSignal Worker Installed');
});