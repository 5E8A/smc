import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { LanguageProvider } from "./context/LanguageContext";

const App = () => {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
};

export default App;
