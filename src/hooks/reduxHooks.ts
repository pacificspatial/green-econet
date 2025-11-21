// reduxHooks.ts
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";

// Custom hook for dispatch with proper typing
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Custom hook for selecting state with proper typing
export const useAppSelector: <TSelected>(
  selector: (state: RootState) => TSelected
) => TSelected = useSelector;
