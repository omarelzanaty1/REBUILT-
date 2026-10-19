# REBUILT — Web Deployment Foundation

This build keeps the existing Claude source as the base and adds only a small web-delivery layer:

- Web App Manifest (`manifest.webmanifest`)
- Service Worker (`sw.js`)
- Basic PWA metadata
- GitHub Pages-friendly relative URLs

## Current status

The app is still client-side/local-first. Authentication is local placeholder logic and the AI layer is intentionally not connected to a real model yet.

## Next product steps

1. Publish the current web build to GitHub Pages.
2. Connect real authentication and persistent user data with Supabase.
3. Add a secure backend/Edge Function for the real AI model.
4. Test production web flow end-to-end.
5. Wrap the stable web app with Capacitor for Android/iOS.
6. Prepare Google Play and App Store releases.
