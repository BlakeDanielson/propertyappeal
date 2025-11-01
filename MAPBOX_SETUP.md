# Mapbox Setup Instructions

## Get Your Mapbox API Token

1. Go to https://account.mapbox.com/
2. Sign up for a free account (if you don't have one)
3. Go to your Account page → Access tokens
4. Copy your **Default public token** OR create a new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`

## Add Token to Environment Variables

1. Open your `.env.local` file in the `propappeal` directory
2. Remove the old Google Maps API key line (if present):
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   ```

3. Add your Mapbox token:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```

4. Save the file

## Restart Your Dev Server

After adding the token, restart your Next.js dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Mapbox Free Tier

- **100,000 requests/month** for free
- Much more generous than Google Places
- No credit card required for free tier
- Perfect for development and MVP

## What Changed

✅ **Removed:** Google Places API (complex web components, expensive)
✅ **Added:** Mapbox Address Autofill (simple, generous free tier)
✅ **Benefit:** Simpler code, better free tier, easier to maintain

The address input will now use Mapbox for autocomplete suggestions!

