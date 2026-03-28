
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import apiClient from '@/lib/api-client';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsToAcceptTerms: boolean;
  getIdToken: () => Promise<string | null>;
  /** Tras subir avatar, pasa `{ photo_gs_uri: gs_uri }` para que el backend firme sin depender del retraso de Auth. */
  refreshUserProfile: (forceSync?: boolean, options?: { photo_gs_uri?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userProfile: null, 
  loading: true, 
  needsToAcceptTerms: false,
  getIdToken: async () => null,
  refreshUserProfile: async () => {},
});

const syncAndFetchUserProfile = async (
  user: FirebaseUser,
  options?: { photo_gs_uri?: string }
): Promise<UserProfile | null> => {
  try {
    const body: Record<string, unknown> = { trigger_sync: true };
    if (options?.photo_gs_uri) {
      body.photo_gs_uri = options.photo_gs_uri;
    }
    const { profile_data } = await apiClient.post<{ profile_data: UserProfile }>(
      '/create_or_update_user_profile',
      body
    );

    await user.getIdToken(true);

    return profile_data;

  } catch (error) {
    console.error('Failed to sync/fetch user profile from backend:', error);
    throw error;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = useCallback(async (forceSync = false, options?: { photo_gs_uri?: string }) => {
    if (auth.currentUser) {
      try {
        const cachedProfile = sessionStorage.getItem(`userProfile_${auth.currentUser.uid}`);
        if(cachedProfile && !forceSync) {
            setUserProfile(JSON.parse(cachedProfile));
        }
        
        const profile = await syncAndFetchUserProfile(auth.currentUser, options);
        if (profile) {
          setUserProfile(profile);
          sessionStorage.setItem(`userProfile_${auth.currentUser.uid}`, JSON.stringify(profile));
        }
      } catch(error) {
        console.error("AuthContext: Failed to refresh user profile.", error);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); 
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const cachedProfile = sessionStorage.getItem(`userProfile_${firebaseUser.uid}`);
        if(cachedProfile) {
            setUserProfile(JSON.parse(cachedProfile));
        }

        try {
            const profile = await syncAndFetchUserProfile(firebaseUser);
            if (profile) {
                setUserProfile(profile);
                sessionStorage.setItem(`userProfile_${firebaseUser.uid}`, JSON.stringify(profile));
            } else {
                sessionStorage.removeItem(`userProfile_${firebaseUser.uid}`);
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Error on initial user sync:", error);
        }

      } else {
        const lastUid = user?.uid;
        if(lastUid) {
            sessionStorage.removeItem(`userProfile_${lastUid}`);
        }
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        refreshUserProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshUserProfile]);


  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  };
  
  const needsToAcceptTerms = useMemo(() => {
    if (!user || !userProfile) return false;
    return !userProfile.terms_accepted_at;
  }, [user, userProfile]);

  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    needsToAcceptTerms,
    getIdToken,
    refreshUserProfile
  }), [user, userProfile, loading, needsToAcceptTerms, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
