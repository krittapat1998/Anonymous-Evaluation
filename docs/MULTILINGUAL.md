# 🌐 Multilingual Support (i18n)

## Overview

The Anonymous Voting System now supports **Thai (ไทย)** and **English** with a language switcher button in the navigation bar.

## Files Structure

```
frontend/src/
├── i18n.js                           # i18n configuration
├── locales/
│   ├── en.json                       # English translations
│   └── th.json                       # Thai translations
├── components/
│   ├── LanguageSwitcher.jsx          # Language toggle button
│   └── ...
└── styles/
    └── languageSwitcher.css          # Styling for language button
```

## How It Works

### 1. **i18n Configuration** (`src/i18n.js`)
- Initializes i18next with English and Thai resources
- Sets Thai as the default language
- Persists language preference to localStorage

### 2. **Translation Files**
- **`en.json`** - English translations for all pages and components
- **`th.json`** - Thai translations (native Thai language)

### 3. **Language Switcher Component** (`LanguageSwitcher.jsx`)
- Displays current language: "EN" for English, "ไทย" for Thai
- Click to toggle between languages
- Saves preference to localStorage

## Usage in Components

### In React Components:
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <h1>{t('home.title')}</h1>
    <p>{t('home.subtitle')}</p>
  );
}
```

### Key Translation Keys:

#### Navigation (`nav.*`)
- `nav.title` - App title
- `nav.home` - Home link
- `nav.vote` - Vote link
- `nav.results` - Results link
- `nav.logout` - Logout button

#### Home Page (`home.*`)
- `home.title` - Page title
- `home.subtitle` - Page subtitle
- `home.submitFeedback` - Feedback card title
- `home.viewResults` - Results card title
- `home.privacy` - Privacy card title
- Plus feature descriptions and step-by-step guides

#### Voting Page (`voting.*`)
- `voting.title` - Page title
- `voting.selectCandidate` - Candidate selection label
- `voting.strengths` - Strengths section title
- `voting.weaknesses` - Weaknesses section title
- `voting.comments` - Comments section title
- `voting.submitVote` - Submit button
- `voting.success` - Success message
- `voting.error` - Error message
- Plus validation messages and help text

#### Results Page (`results.*`)
- `results.title` - Page title
- `results.yourResults` - Results heading
- `results.strengths` - Strengths chart title
- `results.weaknesses` - Weaknesses chart title
- `results.votes` - Vote count text
- `results.loadingResults` - Loading message

#### Privacy Page (`privacy.*`)
- `privacy.title` - Page title
- `privacy.howWeProtect` - Section heading
- `privacy.whatPeersSee` - Section heading
- `privacy.whatYouSee` - Section heading
- Plus detailed descriptions

## Adding New Translations

### Step 1: Add to English (`src/locales/en.json`)
```json
{
  "newFeature": {
    "title": "New Feature Title",
    "description": "Feature description"
  }
}
```

### Step 2: Add to Thai (`src/locales/th.json`)
```json
{
  "newFeature": {
    "title": "ชื่อเรื่องใหม่",
    "description": "คำอธิบายคุณลักษณะ"
  }
}
```

### Step 3: Use in Component
```jsx
const { t } = useTranslation();
<h1>{t('newFeature.title')}</h1>
<p>{t('newFeature.description')}</p>
```

## Language Persistence

The selected language is saved to browser's localStorage:
```javascript
localStorage.getItem('language') // Returns 'en' or 'th'
```

When user opens the app again, it loads their previous language preference.

## Default Language

- **Default**: Thai (ไทย)
- **Fallback**: English (if translation key not found)

To change default:
```javascript
// In src/i18n.js
lng: localStorage.getItem('language') || 'en', // Change 'th' to 'en'
```

## Supported Languages

| Language | Code | Status |
|----------|------|--------|
| Thai | `th` | ✅ Complete |
| English | `en` | ✅ Complete |

## Components Using i18n

- ✅ `App.jsx` - Navigation and Home/Privacy pages
- ✅ `VotingPage.jsx` - Voting interface
- ✅ `ResultsPage.jsx` - Results display
- ✅ `TokenInput.jsx` - Token input form
- ✅ `VotingForm.jsx` - Voting form
- ✅ `ResultsChart.jsx` - Results charts
- ✅ `LanguageSwitcher.jsx` - Language toggle

## Styling

The language switcher button has a gradient purple background and hover effects:

```css
.language-switcher {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 8px 12px;
  border-radius: 6px;
  /* ... */
}
```

Mobile view shows only the flag emoji (🌐) for smaller screens.

## Testing

To test translations:

1. **Start frontend**: `npm run dev`
2. **Click language button** (top-right corner)
3. **Verify all text changes** to selected language
4. **Refresh page** and verify language is remembered

## Performance

- Translations loaded at startup (minimal overhead)
- No external API calls needed
- localStorage provides instant persistence
- String keys for fast lookups

## Troubleshooting

### Translations not showing?
- Check that key exists in both `en.json` and `th.json`
- Verify correct path: `t('section.key')`
- Check browser console for i18n errors

### Language not saving?
- Verify localStorage is not disabled
- Check DevTools Application tab
- Ensure localStorage has space available

### Missing Thai characters?
- Verify UTF-8 encoding in JSON files
- Check font supports Thai characters (usually default)
- Restart development server

## Future Enhancements

- [ ] Add more languages (Mandarin, Japanese, Vietnamese, etc.)
- [ ] Language selector dropdown instead of toggle
- [ ] RTL language support
- [ ] Server-side language detection based on browser locale
- [ ] Language switcher in footer as well
- [ ] Content-Management-System for translations
- [ ] Automatic translation updates via API

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Supported by**: i18next & react-i18next
