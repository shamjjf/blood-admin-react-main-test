import { createContext } from "react";

export const GlobalContext = createContext();
const defaultState = {
  _id: "",
  roles: "",
};

const getAuthState = () => {
  try {
    const storage = sessionStorage.getItem("auth");
    if (!storage) return defaultState;
    const token = storage.startsWith("Bearer ") ? storage.slice(7) : storage;
    const parts = token.split(".");
    if (parts.length !== 3) return defaultState;
    return JSON.parse(window.atob(parts[1]));
  } catch (e) {
    return defaultState;
  }
};

export const authState = getAuthState();

export const authReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "SIGNIN": {
      sessionStorage.setItem("auth", `Bearer ${payload}`);
      try {
        const parts = payload.split(".");
        if (parts.length !== 3) return defaultState;
        return JSON.parse(window.atob(parts[1]));
      } catch (e) {
        return defaultState;
      }
    }

    case "SIGNOUT": {
      sessionStorage.removeItem("auth");
      return { ...defaultState };
    }

    default:
      return state;
  }
};