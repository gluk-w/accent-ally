# Text Processor - Static Site Deployment Guide

This guide will help you deploy the Text Processor application as a static site on various platforms.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Your API endpoint configured in the settings

## Building for Production

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

This will create a `dist/public` directory containing all static assets.

## Deployment Options

### Option 1: GitHub Pages

1. Create a new repository on GitHub
2. Push your code to the repository
3. Go to repository Settings > Pages
4. Set the source to the `dist/public` directory
5. Your site will be available at `https://<username>.github.io/<repository>`

### Option 2: Netlify

1. Create a Netlify account at https://www.netlify.com
2. Connect your GitHub repository
3. Set the build command to: `npm run build`
4. Set the publish directory to: `dist/public`
5. Click "Deploy site"

### Option 3: Vercel

1. Create a Vercel account at https://vercel.com
2. Import your repository
3. Set the Framework Preset to "Vite"
4. Set the build command to: `npm run build`
5. Set the output directory to: `dist/public`
6. Click "Deploy"

## Configuration

Before deploying, make sure to:

1. Update the API endpoint in the settings dialog
2. Test the application locally with `npm run dev`
3. Verify all features work as expected

## Environment Variables

No environment variables are required for the static deployment since all configuration is handled through the settings dialog and stored in localStorage.

## Post-Deployment

After deploying:

1. Open the deployed site
2. Click the settings gear icon
3. Configure your API endpoint and language preferences
4. Test the text processing functionality

## Troubleshooting

If you encounter issues:

1. Verify your API endpoint is accessible from the deployed site
2. Check if CORS is properly configured on your API
3. Clear localStorage and reconfigure settings if needed

## Development

To run locally:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`
