import { GoogleAuth } from "@daniele-rolli/capacitor-google-auth";
import { auth } from "../firebase/config";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

const WEB_CLIENT_ID = '234880016165-d0ihml81bb04nqgtog041f6mjhl3g27g.apps.googleusercontent.com';

let initialized = false;

async function ensureInitialized() {
    if (initialized) return;
    await GoogleAuth.initialize({
        clientId: WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true
    });
    initialized = true;
}

export const signInWithGoogleNative = async () => {
    try {
        await ensureInitialized();
        
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        
        if (!idToken) {
            throw new Error("No ID token received from Google");
        }
        
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        
        return { success: true, user: result.user };
        
    } catch (error) {
        console.error("Native Google Sign-In error:", error);
        
        if (error.message?.includes("10:")) {
            return { success: false, error: "Google Sign-In configuration error. Please check app credentials." };
        }
        if (error.message?.includes("16:")) {
            return { success: false, error: "Account reauthentication failed. Please try again." };
        }
        
        return { success: false, error: error.message || "Google Sign-In failed" };
    }
};

export const isNativePlatform = () => {
    const platform = Capacitor.getPlatform();
    return platform === 'android' || platform === 'ios';
};