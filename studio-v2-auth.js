import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged
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

async function startGoogleSignIn() {
  if (!signInButton) return;

  signInButton.disabled = true;
  showStatus('Opening Google sign-in...');

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const code = error?.code || '';

    if (code === 'auth/popup-blocked') {
      showStatus('Popup blocked. Opening full-page Google sign-in...');
      await signInWithRedirect(auth, provider);
      return;
    }

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      showStatus('Sign-in was closed. Click the button to try again.');
    } else if (code === 'auth/unauthorized-domain') {
      showStatus('This website domain is not approved in Firebase Authentication.');
    } else {
      showStatus(`Sign-in error: ${error?.message || 'Unknown error'}`);
    }
  } finally {
    signInButton.disabled = false;
  }
}

signInButton?.addEventListener('click', startGoogleSignIn);
signOutButton?.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async user => {
  if (!user) {
    showLoggedOut();
    return;
  }

  const email = (user.email || '').toLowerCase();
  if (!approvedEmails.has(email)) {
    await signOut(auth);
    showStatus(`Access denied for ${email || 'that account'}. Use an approved Trent Studio account.`);
    return;
  }

  showStatus('Signed in successfully.');
  showStudio();
});

window.addEventListener('unhandledrejection', event => {
  console.error('Studio authentication error:', event.reason);
  showStatus(`Studio login error: ${event.reason?.message || event.reason || 'Unknown error'}`);
});
