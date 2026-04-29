import { useEffect, useState } from "react";
import { AUTH_CHANGE_EVENT, getAuthToken } from "./authStorage";

export function useAuthToken() {
  const [token, setToken] = useState(() => getAuthToken());

  useEffect(() => {
    const update = () => setToken(getAuthToken());

    update();

    window.addEventListener(AUTH_CHANGE_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return token;
}

