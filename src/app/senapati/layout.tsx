"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SenapatiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function handleUnauthorized(reason: "unauthenticated" | "pending" | "error") {
      if (reason !== "unauthenticated") {
        await supabase.auth.signOut();
      }
      if (isMounted) {
        const query = reason === "pending" ? "?error=pending_approval" : "";
        router.replace(`/login${query}`);
      }
    }

    async function verifySenapati() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          await handleUnauthorized("unauthenticated");
          return;
        }

        // Query by Primary Key ID and check role and approval status
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("status, role")
          .eq("id", user.id)
          .maybeSingle();

        if (error || !profile) {
          await handleUnauthorized("error");
          return;
        }

        // Admins can access; Senapatis must have status === 'approved'
        const isAdmin = profile.role === "admin";
        const isApprovedSenapati = profile.role === "senapati" && profile.status === "approved";

        if (!isAdmin && !isApprovedSenapati) {
          await handleUnauthorized("pending");
          return;
        }

        if (isMounted) {
          setIsAuthorized(true);
          setLoading(false);
        }
      } catch {
        await handleUnauthorized("error");
      }
    }

    verifySenapati();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Verifying Senapati Authorization...
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}