import { Box } from "@mui/material";
import Header from "@/components/layout/Header";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header />
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
