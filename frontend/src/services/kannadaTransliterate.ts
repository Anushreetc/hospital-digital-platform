/**
 * Ultra-Refined Kannada to Phonetic Latin (Kanglish) Transliteration
 * Optimizes Kannada prosody, syllable balance, and natural pauses
 * for fluid, lifelike Indian speech synthesis.
 */

const KANNADA_VOWELS: Record<string, string> = {
  'ಅ': 'a',
  'ಆ': 'aa',
  'ಇ': 'i',
  'ಈ': 'ee',
  'ಉ': 'u',
  'ಊ': 'oo',
  'ಋ': 'ru',
  'ಎ': 'e',
  'ಏ': 'ay',
  'ಐ': 'ai',
  'ಒ': 'o',
  'ಓ': 'oh',
  'ಔ': 'au',
  'ಂ': 'm',
  'ಃ': 'h'
};

const KANNADA_MATRAS: Record<string, string> = {
  'ಾ': 'aa',
  'ಿ': 'i',
  'ೀ': 'ee',
  'ು': 'u',
  'ೂ': 'oo',
  'ೃ': 'ru',
  'ೆ': 'e',
  'ೇ': 'ay',
  'ೈ': 'ai',
  'ೊ': 'o',
  'ೋ': 'oh',
  'ೌ': 'au',
  'ಂ': 'm',
  'ಃ': 'h'
};

const KANNADA_CONSONANTS: Record<string, string> = {
  'ಕ': 'k', 'ಖ': 'kh', 'ಗ': 'g', 'ಘ': 'gh', 'ಙ': 'ng',
  'ಚ': 'ch', 'ಛ': 'chh', 'ಜ': 'j', 'ಝ': 'jh', 'ಞ': 'ny',
  'ಟ': 't', 'ಠ': 'th', 'ಡ': 'd', 'ಢ': 'dh', 'ಣ': 'n',
  'ತ': 'th', 'ಥ': 'th', 'ದ': 'd', 'ಧ': 'dh', 'ನ': 'n',
  'ಪ': 'p', 'ಫ': 'f', 'ಬ': 'b', 'ಭ': 'bh', 'ಮ': 'm',
  'ಯ': 'y', 'ರ': 'r', 'ಱ': 'r', 'ಲ': 'l', 'ವ': 'v',
  'ಶ': 'sh', 'ಷ': 'sh', 'ಸ': 's', 'ಹ': 'h', 'ಳ': 'l'
};

// High-fidelity hospitality & clinical speech phrase dictionary
const COMMON_PHRASES: Record<string, string> = {
  'ನಮಸ್ಕಾರ': 'Namaskaara,',
  'ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ': 'City Care aaspatrege, susvaagatha.',
  'ಸಿಟಿ ಕೇರ್': 'City Care',
  'ಆಸ್ಪತ್ರೆಗೆ': 'aaspatrege',
  'ಆಸ್ಪತ್ರೆ': 'aaspatre',
  'ಸುಸ್ವಾಗತ': 'susvaagatha,',
  'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು': 'appointment kaayidarisalu,',
  'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್': 'appointment',
  'ಅಪಾಯಿಂಟ್ಮೆಂಟ್': 'appointment',
  'ಕಾಯ್ದಿರಿಸಲು': 'kaayidarisalu,',
  'ನಿಮ್ಮ ಹೆಸರು ಏನು': 'nimma hesaru enu?',
  'ನಿಮ್ಮ ಹೆಸರು': 'nimma hesaru',
  'ನಿಮ್ಮ': 'nimma',
  'ಹೆಸರು': 'hesaru',
  'ಏನು': 'enu',
  'ಧನ್ಯವಾದಗಳು': 'Dhanyavaadagalu,',
  'ದೃಢೀಕರಣ': 'drudheekarana',
  'ಪಡೆಯಲು': 'padeyalu',
  'ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ': 'mobile sankhyeyannu thilisi.',
  'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ': 'mobile number',
  'ಮೊಬೈಲ್': 'mobile',
  'ಸಂಖ್ಯೆಯನ್ನು': 'sankhyeyannu',
  'ಸಂಖ್ಯೆ': 'sankhye',
  'ತಿಳಿಸಿ': 'thilisi',
  'ನಮೂದಿಸಿ': 'namoodisi',
  'ನೀವು ಯಾವ ವಿಭಾಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ': 'neevu yaava vibhaagavannu hudukuthiddeeri?',
  'ನೀವು': 'neevu',
  'ಯಾವ': 'yaava',
  'ವಿಭಾಗವನ್ನು': 'vibhaagavannu',
  'ವಿಭಾಗ': 'vibhaaga',
  'ವಿಭಾಗದಲ್ಲಿ': 'vibhaagadalli',
  'ಹುಡುಕುತ್ತಿದ್ದೀರಿ': 'hudukuthiddeeri',
  'ಕಾರ್ಡಿಯಾಲಜಿ': 'Cardiology,',
  'ಹೃದ್ರೋಗ': 'Hrudroga,',
  'ಹೃದಯ': 'Hrudaya,',
  'ನ್ಯೂರಾಲಜಿ': 'Neurology,',
  'ಮೆದುಳು': 'Medulu,',
  'ಆರ್ಥೋಪೆಡಿಕ್ಸ್': 'Orthopedics,',
  'ಮೂಳೆ': 'Moole,',
  'ವೈದ್ಯರು': 'vaidyaru',
  'ಡಾಕ್ಟರ್': 'Doctor',
  'ಲಭ್ಯವಿದ್ದಾರೆ': 'labhyaviddaare.',
  'ದಿನಾಂಕದಂದು': 'dinaankadandu',
  'ದಿನಾಂಕ': 'dinaanka',
  'ಬರಲು ಬಯಸುತ್ತೀರಿ': 'baralu bayasuttheeri?',
  'ಬರಲು': 'baralu',
  'ಬಯಸುತ್ತೀರಿ': 'bayasuttheeri',
  'ನಾಳೆ': 'naale',
  'ಇವತ್ತು': 'ivatthu',
  'ಸೋಮವಾರ': 'somavaara',
  'ಸಮಯ': 'samaya',
  'ಬೆಳಿಗ್ಗೆ': 'beligge',
  'ಸಂಜೆ': 'sanje',
  'ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ': 'vivaragalannu parisheelisi,',
  'ವಿವರಗಳನ್ನು': 'vivaragalannu',
  'ಪರಿಶೀಲಿಸಿ': 'parisheelisi',
  'ರೋಗಿ': 'rogi',
  'ಬುಕಿಂಗ್': 'booking',
  'ಖಚಿತಪಡಿಸಲು ಹೌದು ಎಂದು ಹೇಳಿ': 'khachithapadisalu, haudu endu heli.',
  'ಖಚಿತಪಡಿಸಲು': 'khachithapadisalu',
  'ಖಚಿತಪಡಿಸಿ': 'khachithapadisi',
  'ಹೌದು': 'haudu',
  'ಸರಿ': 'sari',
  'ಎಂದು': 'endu',
  'ಹೇಳಿ': 'heli',
  'ಅಭಿನಂದನೆಗಳು': 'Abhinandanegalu!',
  'ಯಶಸ್ವಿಯಾಗಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ': 'yashasviyaagi kaayidarisalaagide.',
  'ಯಶಸ್ವಿಯಾಗಿ': 'yashasviyaagi',
  'ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ': 'kaayidarisalaagide',
  'ದಯವಿಟ್ಟು': 'dayavittu,',
  'ನಿಮಿಷ ಮುಂಚಿತವಾಗಿ ತಲುಪಿ': 'nimisha munchithavaagi thalupi.',
  'ಮುಂಚಿತವಾಗಿ': 'munchithavaagi',
  'ತಲುಪಿ': 'thalupi',
  'ತುರ್ತು ಪರಿಸ್ಥಿತಿ': 'thurtu paristhithi',
  'ಆಂಬ್ಯುಲೆನ್ಸ್': 'ambulance',
  'ಕರೆ ಮಾಡಿ': 'kare maadi',
  'ಚಿಕಿತ್ಸಾ ಭೇಟಿ ನೀಡಿ': 'chikithsaa bheti needi'
};

export function transliterateKannadaToPhonetic(text: string): string {
  if (!text) return '';

  let processed = text;

  // 1. Substitute phrase-level tokens with natural punctuation
  for (const [kn, ph] of Object.entries(COMMON_PHRASES)) {
    processed = processed.split(kn).join(` ${ph} `);
  }

  // 2. Character-level phonetic fallback for proper names
  let result = '';
  const len = processed.length;

  for (let i = 0; i < len; i++) {
    const char = processed[i];
    const code = char.charCodeAt(0);

    // If outside Kannada Unicode block (0x0C80 - 0x0CFF), preserve character
    if (code < 0x0c80 || code > 0x0cff) {
      result += char;
      continue;
    }

    // Vowels
    if (KANNADA_VOWELS[char]) {
      result += KANNADA_VOWELS[char];
      continue;
    }

    // Consonants + Matras
    if (KANNADA_CONSONANTS[char]) {
      const nextChar = i + 1 < len ? processed[i + 1] : '';

      if (nextChar === '್') { // Halant (suppresses inherent 'a')
        result += KANNADA_CONSONANTS[char];
        i++;
      } else if (KANNADA_MATRAS[nextChar]) {
        result += KANNADA_CONSONANTS[char] + KANNADA_MATRAS[nextChar];
        i++;
      } else {
        result += KANNADA_CONSONANTS[char] + 'a';
      }
      continue;
    }

    if (KANNADA_MATRAS[char]) {
      result += KANNADA_MATRAS[char];
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
