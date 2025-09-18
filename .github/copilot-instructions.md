# LawGenie: AI-Powered Legal Document Analysis

## Project Overview

LawGenie is a backend service for analyzing legal documents (PDF/DOCX) using Google's Generative AI (Gemini). It provides document upload, analysis, summarization, and translation capabilities.

## Architecture

### Core Components

- **API Server**: Express.js application (`index.js`)
- **Routes**: Document upload, analysis, and management (`routes/`)
- **Services**:
  - `geminiService.js`: Document analysis using Google Gemini API
  - `storageService.js`: File storage with Google Cloud Storage
  - `translateService.js`: Document translation using Gemini

### Data Flow

1. User uploads documents via `/api/upload` endpoint
2. Documents are temporarily stored in `uploads/` folder
3. Analysis/translation is performed via Gemini API
4. Results are returned to the client

## Development Setup

### Environment Variables

Required `.env` configuration:

```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
BUCKET_NAME=your_gcs_bucket_name
```

### Commands

- `npm start`: Run production server
- `npm run dev`: Run development server with nodemon

## Key Patterns & Conventions

### API Response Format

Successful responses follow this pattern:

```javascript
res.json({
  message: "Operation completed successfully ✅",
  // operation-specific data
});
```

### Error Handling

Error responses use appropriate HTTP status codes and follow this format:

```javascript
res.status(400).json({ error: "Description of the error" });
```

### File Handling

- Uploaded files are stored in `uploads/` directory with unique hash names
- Supported file types: PDF and DOCX (.doc files not supported)
- Example file path pattern: `uploads/0a1d2e2fbf8fc38758c3a5588dd36443-filename.pdf`

## Integration Points

### Google Cloud APIs

- **Gemini AI**: Used for document analysis and translation
- **Google Cloud Storage**: For permanent document storage (WIP)

## Common Tasks

### Adding New Analysis Features

1. Add new analysis function to `services/geminiService.js`
2. Create appropriate prompt templates
3. Update route handler in `routes/analyze.js`

### Updating Translation Logic

Modify the `translateText` and `translateAnalysisResult` functions in `services/translateService.js`

## Notes and Limitations

- Currently using Gemini-1.5-Flash model for all AI operations
- Maximum document size is limited by multer defaults (check documentation)
- The project uses ES modules (`"type": "module"` in package.json)
- File upload has two implementations - one in `routes/upload.js` and another in `routes/docs.js` (potential refactoring needed)
