"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { store } from "@/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );
}
