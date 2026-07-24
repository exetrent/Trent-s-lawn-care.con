import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getRedirectResult
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCdTFyZoBAKfO0L5ZAZ-IP4cqltnlEs1l4',
  authDomain: 'trentlawn-care.firebaseapp.com',
  projectId: 'trentlawn-care',
  storageBucket: 'trentlawn-care.firebasestorage.app',
  messagingSenderId: '440907459371',
  appId: '1:440907459371:web:2a4a9a8bf1594d2f14336e'
};

const approvedEmails = new Set([
  'trents.lawncare.ky@gmail.com',
  'trenton77@gmail.com',
  'trenton7070@gmail.com'
]);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const signInButton = document.getElementById('signIn');
const signOutButton = document.getElementById('signOut');
const loginStatus = document.getElementById('loginStatus');
const loginView = document.getElementById('login');
const studioView = document.getElementById('studio');

let signInBusy = false;
let authStateResolved = false;

loginStatus?.setAttribute('role', 'status');
loginStatus?.setAttribute('aria-live', 'polite');

function showStatus(message) {
  if (loginStatus) loginStatus.textContent = message;
}

function showLoggedOut() {
  loginView?.classList.remove('hidden');
  studioView?.classList.add('hidden');
}

function showStudio() {
  loginView?.classList.add('hidden');
  studioView?.classList.remove('hidden');
}

function setButtonReady(ready) {
  if (!signInButton) return;
  signInButton.disabled = !ready || signInBusy;
  signInButton.textContent = signInBusy ? 'Opening Google…' : 'Sign in with Google';
}

function approvedEmail(user) {
  return (user?.email || '').trim().toLowerCase();
}

function readableError(error) {
  const code = error?.code || '';

  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google sign-in window. Allow pop-ups for trentslawncare.com, then click Sign in with Google again.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'The Google sign-in window closed before login finished. Click the button and keep the window open until it returns to the Studio.';
  }
  if (code === 'auth/unauthorized-domain') {
    return `Firebase rejected this domain (${window.location.hostname}). Refresh the page and try again.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Authentication.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Google sign-in could not reach the network. Check your connection and try again.';
  }
  if (code === 'auth/web-storage-unsupported') {
    return 'Your browser privacy settings blocked sign-in storage. Try a normal Chrome window instead of Incognito and allow cookies for Google/Firebase.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'That email is already connected to a different sign-in method.';
  }

  return `Google sign-in error${code ? ` (${code})` : ''}: ${error?.message || 'Unknown error'}`;
}

async function checkGoogleProvider() {
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: 'google.com',
      continueUri: `${window.location.origin}${window.location.pathname}`,
      customParameter: { prompt: 'select_account' }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.authUri) {
    const message = payload?.error?.message || `provider check failed (${response.status})`;
    throw new Error(message);
  }

  return true;
}

async function configurePersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (localError) {
    console.warn('Local Firebase persistence unavailable. Using session persistence.', localError);
    await setPersistence(auth, browserSessionPersistence);
  }
}

async function startGoogleSignIn() {
  if (!signInButton || signInBusy) return;

  if (!navigator.onLine) {
    showStatus('You appear to be offline. Connect to the internet and try again.');
    return;
  }

  signInBusy = true;
  setButtonReady(false);
  showStatus('Opening the secure Google account window…');

  try {
    const result = await signInWithPopup(auth, provider);
    const email = approvedEmail(result.user);

    if (!approvedEmails.has(email)) {
      await signOut(auth);
      showLoggedOut();
      showStatus(`Access denied for ${email || 'that account'}. Choose trenton7070@gmail.com or another approved Studio account.`);
      return;
    }

    showStatus('Signed in successfully. Opening Trent Studio…');
    showStudio();
  } catch (error) {
    console.error('Google sign-in failed:', error);
    showLoggedOut();
    showStatus(readableError(error));
  } finally {
    signInBusy = false;
    setButtonReady(true);
  }
}

signInButton?.addEventListener('click', startGoogleSignIn);
signOutButton?.addEventListener('click', async () => {
  await signOut(auth);
  showStatus('Signed out.');
});

onAuthStateChanged(auth, async user => {
  authStateResolved = true;

  if (!user) {
    showLoggedOut();
    return;
  }

  const email = approvedEmail(user);
  if (!approvedEmails.has(email)) {
    await signOut(auth);
    showLoggedOut();
    showStatus(`Access denied for ${email || 'that account'}. Choose an approved Trent Studio account.`);
    return;
  }

  showStatus(`Signed in as ${email}.`);
  showStudio();
});

async function initializeGoogleLogin() {
  showLoggedOut();
  setButtonReady(false);
  showStatus('Checking secure Google sign-in…');

  try {
    await configurePersistence();

    // Completes any older redirect attempt, while new sign-ins use the more
    // reliable popup flow for this GitHub Pages-hosted website.
    await getRedirectResult(auth);

    try {
      await checkGoogleProvider();
      if (!auth.currentUser) {
        showStatus('Google sign-in is ready. Use trenton7070@gmail.com or another approved Studio account.');
      }
    } catch (preflightError) {
      console.warn('Google provider preflight could not be confirmed in this browser.', preflightError);
      if (!auth.currentUser) {
        showStatus('Google sign-in is ready to try. Click the button below.');
      }
    }
  } catch (error) {
    console.error('Studio authentication setup failed:', error);
    showStatus(readableError(error));
  } finally {
    setButtonReady(true);
  }
}

window.addEventListener('online', () => {
  if (!auth.currentUser && authStateResolved) showStatus('Back online. Google sign-in is ready.');
});
window.addEventListener('offline', () => {
  if (!auth.currentUser) showStatus('You are offline. Google sign-in needs an internet connection.');
});
window.addEventListener('unhandledrejection', event => {
  console.error('Studio authentication error:', event.reason);
});

initializeGoogleLogin();
