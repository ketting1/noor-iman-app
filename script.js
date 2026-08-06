// ============================================================
// NOOR & IMAN – Shared JavaScript (Voice + Navigation)
// ============================================================

// ============================================================
// VOICE STATE (shared across all pages)
// ============================================================
let speechEnabled = false;
let selectedVoice = null;

// ============================================================
// UPDATE STATUS MESSAGE
// ============================================================
function updateStatus(elementId, message, type = '') {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.className = 'status ' + type;
  }
}

// ============================================================
// LOAD ARABIC VOICE (with retry)
// ============================================================
function loadVoices() {
  return new Promise((resolve) => {
    // Check if browser supports speech
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      resolve(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;

    const check = () => {
      const voices = speechSynthesis.getVoices();
      attempts++;

      if (voices && voices.length > 0) {
        // Prefer Arabic voices
        const arabic = voices.find(
          (v) => v.lang === 'ar-SA' || v.lang === 'ar-EG' || v.lang.startsWith('ar')
        );
        selectedVoice = arabic || voices[0];
        console.log('✅ Voice loaded:', selectedVoice.name, selectedVoice.lang);
        resolve(true);
        return;
      }
      

      if (attempts < maxAttempts) {
        setTimeout(check, 200);
      } else {
        console.warn('❌ No voices found after', maxAttempts, 'attempts');
        resolve(false);
      }
    };

    // Start checking immediately
    check();

    // Also listen for the 'voiceschanged' event as a backup
    speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        if (!selectedVoice) {
          const voices = speechSynthesis.getVoices();
          if (voices.length) {
            const arabic = voices.find(
              (v) => v.lang === 'ar-SA' || v.lang === 'ar-EG' || v.lang.startsWith('ar')
            );
            selectedVoice = arabic || voices[0];
            console.log('✅ Voice loaded (via event):', selectedVoice.name);
            resolve(true);
          }
        }
      },
      { once: true }
    );
  });
}

// ============================================================
// PLAY LETTER SOUND – MP3 first, fallback to TTS
// ============================================================
function playLetterSound(letterData, statusElementId) {
  // Try MP3 first
  const audio = new Audio(letterData.mp3);

  audio.play().catch(function (error) {
    // MP3 failed – fallback to TTS
    console.log('MP3 not found, using TTS for:', letterData.char);

    if (!speechEnabled) {
      if (statusElementId) {
        updateStatus(statusElementId, '⚠️ Please enable voice first!', 'error');
      } else {
        alert('Please enable voice first!');
      }
      return;
    }

    if (!window.speechSynthesis) {
      if (statusElementId) {
        updateStatus(statusElementId, '❌ Speech not supported', 'error');
      }
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(letterData.sound);
    utterance.lang = 'ar';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
      if (statusElementId) {
        updateStatus(
          statusElementId,
          `🔊 Speaking: ${letterData.name} (TTS)`,
          'ready'
        );
      }
    }, 50);
  });
}

// ============================================================
// ENABLE VOICE (called by button click)
// ============================================================
async function enableVoiceGlobal(statusElementId) {
  if (!statusElementId) statusElementId = 'homeStatus';

  updateStatus(statusElementId, '🔄 Loading voice...', '');

  const success = await loadVoices();

  if (success) {
    speechEnabled = true;
    updateStatus(
      statusElementId,
      '✅ Voice active! MP3 or TTS will play.',
      'ready'
    );

    // Test speak to confirm
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance('أَلِف  باء  تاء');
      utterance.lang = 'ar';
      utterance.rate = 0.85;
      if (selectedVoice) utterance.voice = selectedVoice;
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  } else {
    updateStatus(
      statusElementId,
      '❌ Voice failed. Tap again or install Google TTS from Play Store.',
      'error'
    );
  }
}

// ============================================================
// NAVIGATION FUNCTIONS
// ============================================================
function startLesson() {
  window.location.href = 'lessons/alphabet.html';
}

function goHome() {
  window.location.href = '../index.html';
}

// ============================================================
// INITIALISE HOME PAGE (when DOM loads)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  // ---- Home page voice button ----
  const homeVoiceBtn = document.getElementById('homeVoiceBtn');
  if (homeVoiceBtn) {
    homeVoiceBtn.addEventListener('click', function () {
      enableVoiceGlobal('homeStatus');
    });
  }

  // ---- Pre-load voices silently (caching) ----
  loadVoices().then((success) => {
    if (success) {
      const statusEl = document.getElementById('homeStatus');
      if (statusEl && !speechEnabled) {
        // Don't overwrite if already enabled
        updateStatus(
          'homeStatus',
          '✅ Voice pre-loaded! Tap "Enable Voice" to activate.',
          'ready'
        );
      }
    }
  });

  // ---- Console welcome ----
  console.log('🌟 Noor & Iman loaded successfully!');
  console.log('📁 Files: index.html | style.css | script.js');
  console.log('🔊 Tap "Enable Voice" to activate speech.');
});
