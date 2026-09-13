import { useCallback, useEffect, useState } from "react";
import { getMe } from "@/lib/proxy/fns";
import type { Profile } from "@/lib/proxy/types";
import { errMsg } from "@/lib/utils";

export function useMe() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      setProfile(me);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, error, loading, reload };
}
