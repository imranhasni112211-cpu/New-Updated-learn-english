import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App lazily to avoid multi-init errors
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// We add all required drive scopes
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.addScope("https://www.googleapis.com/auth/drive.metadata.readonly");
provider.addScope("https://www.googleapis.com/auth/drive");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google Access Token. Please ensure you granted sufficient permissions.");
    }

    cachedAccessToken = credential.accessToken;
    // Store in session storage for refreshing across components
    sessionStorage.setItem("drive_access_token", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = sessionStorage.getItem("drive_access_token");
  }
  return cachedAccessToken;
};

export const logoutDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem("drive_access_token");
};

// Google Drive API integration helper functions
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  size?: string;
}

// 1. Check/Create Folder
export async function getOrCreateStudyFolder(token: string): Promise<string> {
  const folderName = "Learn_English_Study_Labs";
  
  // Search for existing folder
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // Create new folder
  const createRes = await fetch(`https://www.googleapis.com/drive/v3/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder"
    })
  });
  const createData = await createRes.json();
  return createData.id;
}

// 2. Upload/Save File to Study Folder
export async function saveStudyFileToDrive(
  token: string, 
  fileName: string, 
  content: string, 
  mimeType: string = "text/plain"
): Promise<any> {
  try {
    const folderId = await getOrCreateStudyFolder(token);
    
    // Metadata part
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: mimeType
    };
    
    // Boundary setting for multi-part payload
    const boundary = "314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    
    const multipartBody = 
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error("Failed to save study files: " + errText);
    }
    
    return await res.json();
  } catch (error: any) {
    console.error("saveStudyFileToDrive Error:", error);
    throw error;
  }
}

// 3. List files inside Study Folder
export async function listStudyFiles(token: string): Promise<DriveFile[]> {
  try {
    const folderId = await getOrCreateStudyFolder(token);
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,createdTime,size)&orderBy=createdTime desc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error("Failed to list files from your Google Drive");
    }
    
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error("listStudyFiles Error:", error);
    return [];
  }
}

// 4. Read File Content
export async function readFileContent(token: string, fileId: string): Promise<string> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error("Failed to load file contents from Google Drive");
    }
    
    return await res.text();
  } catch (error: any) {
    console.error("readFileContent Error:", error);
    throw error;
  }
}
