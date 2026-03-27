import { createContext } from "react";

export const GlobalContext = createContext();
const defaultState = {
  _id: "",
  roles: "",
};
const storage = sessionStorage.getItem("auth");

export const authState = storage
  ? JSON.parse(window.atob(storage.slice(7).split(".")[1]))
  : defaultState;

export const authReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "SIGNIN": {
      sessionStorage.setItem("auth", `Bearer ${payload}`);
      return JSON.parse(window.atob(payload.split(".")[1]));
    }

    case "SIGNOUT": {
      sessionStorage.removeItem("auth");
      return { ...defaultState };
    }

    default:
      return state;
  }
};
