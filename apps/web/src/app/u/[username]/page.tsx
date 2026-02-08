import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import UserProfileClient from "./client";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, bio, reputation_score")
    .eq("username", username)
    .single();

  if (!profile) {
    return { title: "Kullanici Bulunamadi - Entrika" };
  }

  return {
    title: `${profile.username} - Entrika`,
    description: profile.bio || `${profile.username} Entrika'da. Puan: ${profile.reputation_score}`,
    openGraph: {
      title: `${profile.username} - Entrika`,
      description: profile.bio || `Topluluk puani: ${profile.reputation_score}`,
      type: "profile",
    },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  return <UserProfileClient username={username} />;
}
