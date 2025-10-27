import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { Dashboard } from "@/components/Dashboard";
import { OnboardingFlow } from "@/components/OnboardingFlow";

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserProfile(session.user.id);
      } else {
        setCheckingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    setHasProfile(!!data);
    setCheckingProfile(false);
  };

  useEffect(() => {
    if (session?.user) {
      checkUserProfile(session.user.id);
    }
  }, [session]);

  if (loading || (session && checkingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!hasProfile) {
    return <OnboardingFlow onComplete={() => setHasProfile(true)} />;
  }

  return <Dashboard />;
};

export default Index;