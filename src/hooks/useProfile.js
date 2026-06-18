import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";

// Shared user-profile query (name, role, avatar_url, tenant). Cached under
// ["profile"] so the header, Settings, etc. share one source + one fetch.
async function fetchProfile() {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*, tenants(*)")
    .eq("id", authUser.id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
}
