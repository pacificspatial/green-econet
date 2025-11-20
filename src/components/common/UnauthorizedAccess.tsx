import React from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useTranslation } from "react-i18next";
import { logout } from "@/utils/authUtils/logout";

function UnauthorizedAccess() {
  const { signOut } = useAuthenticator((context) => [context.user]);
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: (theme) => theme.palette.background.default,
        p: 2,
      }}
    >
      <Card
        sx={{
          width: { xs: "90%", sm: "70%", md: "50%" },
          boxShadow: 8,
          borderRadius: 4,
          p: 4,
          textAlign: "center",
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
      >
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            {t("app.accessDenied")}
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: "text.secondary" }}
          >
            {t("app.accessDeniedMessage")}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => logout(signOut)}
            sx={{
              mt: 3,
              borderRadius: 20,
              px: 4,
              py: 1.5,
              textTransform: "uppercase",
              fontWeight: "bold",
              boxShadow: 6,
              "&:hover": {
                boxShadow: 8,
              },
            }}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default UnauthorizedAccess;
