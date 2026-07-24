import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
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

const BUSINESS_EMAIL = 'trents.lawncare.ky@gmail.com';
const approvedEmails = new Set([BUSINESS_EMAIL]);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
  login_hint: BUSINESS_EMAIL
});

const signInButton = document.getElementById('signIn');
const redirectButton = document.getElementById('signInRedirect');
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

function setButtonsReady(ready) {
  const disabled = !ready || signInBusy;
  if (signInButton) {
    signInButton.disabled = disabled;
    signInButton.textContent = signInBusy
      ? 'Opening Google…'
      : "Sign in with Trent's Lawn Care Google";
  }
  if (redirectButton) redirectButton.disabled = disabled;
}

function userEmail(user) {
  return (user?.email || '').trim().toLowerCase();
}

async function approveUser(user) {
  const email = userEmail(user);
  if (!approvedEmails.has(email)) {
    await signOut(auth);
    showLoggedOut();
    showStatus(`Access denied for ${email || 'that account'}. Use ${BUSINESS_EMAIL}.`);
    return false;
  }
  showStatus(`Signed in with the Trent's Lawn Care account: ${email}.`);
  showStudio();
  return true;
}

function readableError(error) {
  const code = error?.code || '';

  if (code === 'auth/popup-blocked') {
    return 'Chrome blocked the pop-up. Use the Full-page Google sign-in button below.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'The Google window closed before sign-in finished. Try again or use Full-page Google sign-in.';
  }
  if (code === 'auth/unauthorized-domain') {
    return `Firebase rejected this domain (${window.location.hostname}).`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Authentication.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Google sign-in could not reach the network. Check your connection and try again.';
  }
  if (code === 'auth/web-storage-unsupported') {
    return 'Browser privacy settings blocked sign-in storage. Use a normal Chrome window, not Incognito.';
  }
  if (code === 'auth/operation-not-supported-in-this-environment') {
    return 'This browser cannot use the pop-up method. Use Full-page Google sign-in.';
  }

  return `Google sign-in error${code ? ` (${code})` : ''}: ${error?.message || 'Unknown error'}`;
}

async function configurePersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (localError) {
    console.warn('Local Firebase persistence unavailable. Using session persistence.', localError);
    await setPersistence(auth, browserSessionPersistence);
  }
}

async function startPopupSignIn() {
  if (!signInButton || signInBusy) return;
  if (!navigator.onLine) {
    showStatus('You are offline. Connect to the internet and try again.');
    return;
  }

  signInBusy = true;
  setButtonsReady(false);
  showStatus(`Choose ${BUSINESS_EMAIL} in the Google window.`);

  try {
    const result = await signInWithPopup(auth, provider);
    await approveUser(result.user);
  } catch (error) {
    console.error('Google popup sign-in failed:', error);
    showLoggedOut();
    showStatus(readableError(error));
  } finally {
    signInBusy = false;
    setButtonsReady(true);
  }
}

async function startRedirectSignIn() {
  if (signInBusy) return;
  if (!navigator.onLine) {
    showStatus('You are offline. Connect to the internet and try again.');
    return;
  }

  signInBusy = true;
  setButtonsReady(false);
  showStatus(`Opening full-page Google sign-in for ${BUSINESS_EMAIL}…`);

  try {
    sessionStorage.setItem('trentStudioRedirectLogin', '1');
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error('Google redirect sign-in failed:', error);
    signInBusy = false;
    setButtonsReady(true);
    showStatus(readableError(error));
  }
}

signInButton?.addEventListener('click', startPopupSignIn);
redirectButton?.addEventListener('click', startRedirectSignIn);
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
  await approveUser(user);
});

async function initializeGoogleLogin() {
  showLoggedOut();
  setButtonsReady(false);
  showStatus('Checking secure Google sign-in…');

  try {
    await configurePersistence();
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult?.user) {
      sessionStorage.removeItem('trentStudioRedirectLogin');
      await approveUser(redirectResult.user);
      return;
    }

    if (!auth.currentUser) {
      showStatus(`Google sign-in is ready. Use ${BUSINESS_EMAIL}.`);
    }
  } catch (error) {
    console.error('Studio authentication setup failed:', error);
    showStatus(readableError(error));
  } finally {
    signInBusy = false;
    setButtonsReady(true);
  }
}

window.addEventListener('online', () => {
  if (!auth.currentUser && authStateResolved) {
    showStatus(`Back online. Use ${BUSINESS_EMAIL} to sign in.`);
  }
});
window.addEventListener('offline', () => {
  if (!auth.currentUser) showStatus('You are offline. Google sign-in needs an internet connection.');
});
window.addEventListener('unhandledrejection', event => {
  console.error('Studio authentication error:', event.reason);
});

initializeGoogleLogin();
