import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, Profile, Gender } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const validateInviteCode = async (code: string): Promise<{ valid: boolean; error: Error | null }> => {
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
    try {
      // 1. Validate invite code
      const { data: inviteData, error: inviteError } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", inviteCode.toUpperCase())
        .eq("is_used", false)
        .single();

      if (inviteError || !inviteData) {
        return { error: new Error("Geçersiz veya kullanılmış davetiye kodu") };
      }

      // 2. Check if username is taken
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();

      if (existingUser) {
        return { error: new Error("Bu kullanıcı adı zaten alınmış") };
      }

      // 3. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Kayıt başarısız");

      // 4. Create profile
      const newInviteCode = generateInviteCode();
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        username,
        avatar_url: avatarUrl,
        gender,
        reputation_score: 5.0,
        invite_quota: 3,
        invited_by: inviteData.created_by,
        invite_code: newInviteCode,
        is_verified: false,
      });

      if (profileError) throw profileError;

      // 5. Mark invite code as used
      await supabase
        .from("invite_codes")
        .update({ is_used: true, used_by: authData.user.id, used_at: new Date().toISOString() })
        .eq("id", inviteData.id);

      // 6. Create initial invite codes for new user
      const initialCodes = Array.from({ length: 3 }, () => ({
        code: generateInviteCode(),
        created_by: authData.user!.id,
      }));

      await supabase.from("invite_codes").insert(initialCodes);

      return { error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
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
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        validateInviteCode,
        refreshProfile,
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

// Helper function to generate invite codes
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
