
import React from 'react';
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  const auth = useAuthContext();
  
  return {
    ...auth,
    // Add shorthand helpers here if needed in the future
    isAuthenticated: !!auth.user,
  };
};
