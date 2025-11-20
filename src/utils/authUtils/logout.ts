import { clearUserData, setToken } from "@/redux/slices/authSlice";
import { clearProjects } from "@/redux/slices/projectSlice";
import { store } from "../../redux/store";

export function logout(signOut: () => void) {
  try {
    if (signOut) {
      signOut();
    }

    // Clear Redux state
    store.dispatch(setToken(null));
    store.dispatch(clearProjects());
    store.dispatch(clearUserData());

    // Clear local storage
    localStorage.clear();

    // Redirect the user to the home page
    window.location.href = "/";
  } catch (error) {
    console.error("An error occurred during the logout process:", error);
    alert("An error occurred while logging out. Please try again.");
  }
}
