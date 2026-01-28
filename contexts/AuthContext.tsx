import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, Profile, Gender } from "@/lib/supabase";

// Mock modda çalışmak için (Supabase aktif, false yap)
const MOCK_MODE = false;
const MOCK_SESSION_KEY = "entrika_mock_session";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    gender: Gender,
    avatarUrl: string,
    inviteCode: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  validateInviteCode: (code: string) => Promise<{ valid: boolean; error: Error | null }>;
  refreshProfile: () => Promise<void>;
  mockSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (MOCK_MODE) {
        // Mock modda AsyncStorage'dan session kontrol et
        const mockSession = await AsyncStorage.getItem(MOCK_SESSION_KEY);
        if (mockSession) {
          const mockData = JSON.parse(mockSession);
          setIsAuthenticated(true);
          setProfile(mockData.profile);
        }
        setIsLoading(false);
      } else {
        // Production modda Supabase session kontrol et
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        setIsLoading(false);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsAuthenticated(!!session);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        });

        return () => subscription.unsubscribe();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const mockSignIn = async () => {
    // Mock session oluştur ve kaydet
    const mockProfile: Profile = {
      id: "mock-user-id",
      username: "test_user",
      avatar_url: "https://api.dicebear.com/7.x/lorelei/png?seed=luna",
      gender: "female",
      reputation_score: 5.0,
      invite_quota: 3,
      invited_by: null,
      invite_code: "TESTCODE",
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ profile: mockProfile }));
    setProfile(mockProfile);
    setIsAuthenticated(true);
  };

  const validateInviteCode = async (code: string): Promise<{ valid: boolean; error: Error | null }> => {
    if (MOCK_MODE) {
      const validCodes = ["ENTRIKA2024", "HOSGELDIN", "DAVET123"];
      return { valid: validCodes.includes(code.toUpperCase()), error: null };
    }

    try {
      const { data, error } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_used", false)
        .single();

      if (error || !data) {
        return { valid: false, error: null };
      }

      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    gender: Gender,
    avatarUrl: string,
    inviteCode: string
  ): Promise<{ error: Error | null }> => {
    if (MOCK_MODE) {
      // Mock modda profil oluştur ve kaydet
      const mockProfile: Profile = {
        id: "mock-" + Date.now(),
        username,
        avatar_url: avatarUrl,
        gender,
        reputation_score: 5.0,
        invite_quota: 3,
        invited_by: null,
        invite_code: generateInviteCode(),
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await AsyncStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ profile: mockProfile }));
      setProfile(mockProfile);
      setIsAuthenticated(true);
      return { error: null };
    }

    try {
      console.log("[SIGNUP] 1. Davetiye kodu kontrol ediliyor:", inviteCode.toUpperCase());
      const { data: inviteData, error: inviteError } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", inviteCode.toUpperCase())
        .eq("is_used", false)
        .single();

      console.log("[SIGNUP] 2. Davetiye sonucu:", JSON.stringify({ inviteData: !!inviteData, inviteError }));

      if (inviteError || !inviteData) {
        return { error: new Error("Geçersiz veya kullanılmış davetiye kodu") };
      }

      console.log("[SIGNUP] 3. Kullanici adi kontrol ediliyor:", username);
      const { data: existingUser, error: usernameError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();

      console.log("[SIGNUP] 4. Username sonucu:", JSON.stringify({ existingUser, usernameError }));

      if (existingUser) {
        return { error: new Error("Bu kullanıcı adı zaten alınmış") };
      }

      console.log("[SIGNUP] 5. Supabase auth.signUp cagriliyor...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            avatar_url: avatarUrl,
            gender,
            invited_by: inviteData.created_by,
          },
        },
      });

      console.log("[SIGNUP] 6. Auth sonucu:", JSON.stringify({
        user: authData?.user?.id,
        session: !!authData?.session,
        authError,
      }));

      if (authError) throw authError;
      if (!authData.user) throw new Error("Kayıt başarısız");

      console.log("[SIGNUP] 7. Davetiye kodu kullanildi olarak isaretleniyor...");
      const { error: updateError } = await supabase
        .from("invite_codes")
        .update({ is_used: true, used_by: authData.user.id, used_at: new Date().toISOString() })
        .eq("id", inviteData.id);

      console.log("[SIGNUP] 8. Davetiye update sonucu:", JSON.stringify({ updateError }));

      if (!authData.session) {
        console.log("[SIGNUP] 9. Session yok, manuel giris deneniyor...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log("[SIGNUP] 10. Manuel giris sonucu:", JSON.stringify({
          session: !!signInData?.session,
          signInError,
        }));
        if (signInError) {
          console.log("[SIGNUP] 11. Manuel giris basarisiz, profil direkt cekilecek");
          await fetchProfile(authData.user.id);
          setUser(authData.user);
          setIsAuthenticated(true);
        }
      }

      console.log("[SIGNUP] 12. Kayit tamamlandi!");
      return { error: null };
    } catch (error) {
      console.error("[SIGNUP] HATA:", error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (MOCK_MODE) {
      await mockSignIn();
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (MOCK_MODE) {
      await AsyncStorage.removeItem(MOCK_SESSION_KEY);
      setProfile(null);
      setIsAuthenticated(false);
    } else {
      await supabase.auth.signOut();
      setProfile(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAuthenticated,
        signUp,
        signIn,
        signOut,
        validateInviteCode,
        refreshProfile,
        mockSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
