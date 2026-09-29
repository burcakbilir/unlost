"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";

export function useIsAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    apiGet("/api/auth/me")
      .then(() => {
        if (isMounted) setIsAuthenticated(true);
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return isAuthenticated;
}
