/**
 * Ultra-Refined Conversational Kannada Phonetic Engine
 * Tailored specifically for Indian English & Regional TTS synthesizers
 * to pronounce natural, smooth, conversational Kannada with 100% clarity.
 */

const CONVERSATIONAL_KANNADA_PHRASES: Record<string, string> = {
  // Greetings & Introductions
  'ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು?':
    'Namaskara, City Care hospital ge susvaagatha. Appointment book madalu, nimma hesaru yenu?',
  'ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ':
    'Namaskara, City Care hospital ge susvaagatha.',
  'ನಮಸ್ಕಾರ': 'Namaskara,',
  'ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ': 'City Care hospital ge susvaagatha,',
  'ಸುಸ್ವಾಗತ': 'susvaagatha,',

  // Name & Phone Collection
  'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು': 'Appointment book madalu, nimma hesaru yenu?',
  'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು': 'Appointment book madalu,',
  'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು': 'Appointment book madalu,',
  'ನಿಮ್ಮ ಹೆಸರು ಏನು': 'nimma hesaru yenu?',
  'ನಿಮ್ಮ ಹೆಸರು': 'nimma hesaru',
  'ಧನ್ಯವಾದಗಳು': 'Dhanyavada,',
  'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢೀಕರಣ SMS ಪಡೆಯಲು ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ':
    'Confirmation SMS padayalu, nimma 10-digit mobile number thilisi.',
  'ದೃಢೀಕರಣ SMS ಪಡೆಯಲು': 'Confirmation SMS padayalu,',
  'ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ': 'nimma 10-digit mobile number thilisi.',
  'ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ': 'mobile number thilisi.',
  'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ': 'mobile number',

  // Department Selection
  'ಧನ್ಯವಾದಗಳು! ನೀವು ಯಾವ ವಿಭಾಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ? ಕಾರ್ಡಿಯಾಲಜಿ (ಹೃದಯ), ನ್ಯೂರಾಲಜಿ (ಮೆದುಳು), ಅಥವಾ ಆರ್ಥೋಪೆಡಿಕ್ಸ್ (ಮೂಳೆ)?':
    'Dhanyavada! Neevu yaava department noduththeeri? Cardiology hrudaya, Neurology medulu, athava Orthopedics moole vibhaaga?',
  'ನೀವು ಯಾವ ವಿಭಾಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ': 'Neevu yaava department noduththeeri?',
  'ಕಾರ್ಡಿಯಾಲಜಿ (ಹೃದಯ)': 'Cardiology hrudaya vibhaaga,',
  'ನ್ಯೂರಾಲಜಿ (ಮೆದುಳು)': 'Neurology medulu vibhaaga,',
  'ಆರ್ಥೋಪೆಡಿಕ್ಸ್ (ಮೂಳೆ)': 'Orthopedics moole vibhaaga,',
  'ಕಾರ್ಡಿಯಾಲಜಿ': 'Cardiology,',
  'ನ್ಯೂರಾಲಜಿ': 'Neurology,',
  'ಆರ್ಥೋಪೆಡಿಕ್ಸ್': 'Orthopedics,',
  'ಹೃದ್ರೋಗ': 'Hrudroga,',
  'ಹೃದಯ': 'Hrudaya,',
  'ಮೆದುಳು': 'Medulu,',
  'ಮೂಳೆ': 'Moole,',

  // Doctor & Date/Time
  'ಲಭ್ಯವಿದ್ದಾರೆ': 'labhyaviddare.',
  'ವೈದ್ಯರು': 'Doctors',
  'ಡಾಕ್ಟರ್': 'Doctor',
  'ದಿನಾಂಕದಂದು ಬರಲು ಬಯಸುತ್ತೀರಿ': 'date baralu bayasuttheeri?',
  'ದಿನಾಂಕದಂದು': 'dinaankadandu',
  'ಬರಲು ಬಯಸುತ್ತೀರಿ': 'baralu bayasuttheeri?',
  'ನಾಳೆ': 'naale',
  'ಇವತ್ತು': 'ivatthu',
  'ಬೆಳಿಗ್ಗೆ': 'beligge',
  'ಸಂಜೆ': 'sanje',

  // Verification & Confirmation
  'ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ': 'Vivaragalannu verify maadi,',
  'ಬುಕಿಂಗ್ ಖಚಿತಪಡಿಸಲು ಹೌದು ಎಂದು ಹೇಳಿ': 'Booking confirm madalu, haudu endu heli.',
  'ಖಚಿತಪಡಿಸಲು ಹೌದು ಎಂದು ಹೇಳಿ': 'Confirm madalu, haudu endu heli.',
  'ಖಚಿತಪಡಿಸಿ': 'Confirm maadi,',
  'ಹೌದು': 'haudu',
  'ಸರಿ': 'sari',

  // Completion
  'ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ':
    'Abhinandane! Nimma appointment successfully confirm aagide.',
  'ಅಭಿನಂದನೆಗಳು': 'Abhinandane!',
  'ಯಶಸ್ವಿಯಾಗಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ': 'successfully confirm aagide.',
  'ದಯವಿಟ್ಟು 15 ನಿಮಿಷ ಮುಂಚಿತವಾಗಿ ತಲುಪಿ': 'Dayavittu 15 minutes munche thalupi.',
  'ದಯವಿಟ್ಟು': 'Dayavittu,',
  'ಮುಂಚಿತವಾಗಿ ತಲುಪಿ': 'munche thalupi.',

  // Emergency & Common
  'ತುರ್ತು ಪರಿಸ್ಥಿತಿಗೆ 108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ': 'Emergency aadhare, 108 ambulance ge call maadi.',
  'ಆಂಬ್ಯುಲೆನ್ಸ್': 'ambulance',
  'ಕರೆ ಮಾಡಿ': 'call maadi'
};

const KANNADA_CHAR_MAP: Record<string, string> = {
  'ಅ': 'a', 'ಆ': 'aa', 'ಇ': 'i', 'ಈ': 'ee', 'ಉ': 'u', 'ಊ': 'oo', 'ಋ': 'ru',
  'ಎ': 'e', 'ಏ': 'e', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'o', 'ಔ': 'au', 'ಂ': 'm', 'ಃ': 'h',
  'ಾ': 'aa', 'ಿ': 'i', 'ೀ': 'ee', 'ು': 'u', 'ೂ': 'oo', 'ೃ': 'ru',
  'ೆ': 'e', 'ೇ': 'e', 'ೈ': 'ai', 'ೊ': 'o', 'ೋ': 'o', 'ೌ': 'au',
  'ಕ': 'k', 'ಖ': 'kh', 'ಗ': 'g', 'ಘ': 'gh', 'ಙ': 'ng',
  'ಚ': 'ch', 'ಛ': 'chh', 'ಜ': 'j', 'ಝ': 'jh', 'ಞ': 'ny',
  'ಟ': 't', 'ಠ': 'th', 'ಡ': 'd', 'ಢ': 'dh', 'ಣ': 'n',
  'ತ': 'th', 'ಥ': 'th', 'ದ': 'd', 'ಧ': 'dh', 'ನ': 'n',
  'ಪ': 'p', 'ಫ': 'f', 'ಬ': 'b', 'ಭ': 'bh', 'ಮ': 'm',
  'ಯ': 'y', 'ರ': 'r', 'ಱ': 'r', 'ಲ': 'l', 'ವ': 'v',
  'ಶ': 'sh', 'ಷ': 'sh', 'ಸ': 's', 'ಹ': 'h', 'ಳ': 'l'
};

export function transliterateKannadaToPhonetic(text: string): string {
  if (!text) return '';

  let processed = text;

  // 1. Substitute full conversational phrases with natural Bangalore Kannada prosody
  for (const [kn, ph] of Object.entries(CONVERSATIONAL_KANNADA_PHRASES)) {
    processed = processed.split(kn).join(` ${ph} `);
  }

  // 2. Character-level phonetic fallback for user names
  let result = '';
  const len = processed.length;

  for (let i = 0; i < len; i++) {
    const char = processed[i];
    const code = char.charCodeAt(0);

    if (code < 0x0c80 || code > 0x0cff) {
      result += char;
      continue;
    }

    if (KANNADA_CHAR_MAP[char]) {
      const nextChar = i + 1 < len ? processed[i + 1] : '';

      if (nextChar === '್') {
        result += KANNADA_CHAR_MAP[char];
        i++;
      } else if (KANNADA_CHAR_MAP[nextChar]) {
        result += KANNADA_CHAR_MAP[char] + KANNADA_CHAR_MAP[nextChar];
        i++;
      } else {
        result += KANNADA_CHAR_MAP[char] + 'a';
      }
      continue;
    }

    result += char;
  }

  return result
    .replace(/\s+/g, ' ')
    .replace(/\s,+/g, ',')
    .replace(/\s\.+/g, '.')
    .replace(/\s\?+/g, '?')
    .trim();
}
