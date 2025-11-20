import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Switch,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { fetchUsers, updateUserAttributes, deleteUser } from "@/api/user";
import { UserList, UserRow } from "@/types/User";
import { useAppSelector } from "@/hooks/reduxHooks";
import { ApiError } from "@/types/Error";

const Dashboard = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<UserRow[] | []>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const token = useAppSelector((state) => state.auth.token);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (id: string, currentValue: boolean) => {
    const newValue = !currentValue;
    try {
      await updateUserAttributes(id, { enabled: newValue ? "true" : "false" });
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === id ? { ...row, isVerified: newValue } : row
        )
      );
    } catch (error: unknown) {
      console.error("Failed to update user attributes", error);
      setError((error as Error).message);
    }
  };

  const handleDelete = (id: string) => {
    setUserToDelete(id);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDialogOpen(false);
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete);
      setRows((prevRows) => prevRows.filter((row) => row.id !== userToDelete));
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user", error);
      setError((error as Error).message);
    }
  };

  const cancelDelete = () => {
    setDialogOpen(false);
    setUserToDelete(null);
  };

  const columns: GridColDef<UserRow>[] = [
    {
      field: "username",
      headerName: `${t("app.username")}`,
      flex: 1,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "email",
      headerName: `${t("app.email")}`,
      flex: 1.25,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "createdDate",
      headerName: `${t("app.createdDate")}`,
      flex: 1,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "isVerified",
      headerName: `${t("app.isEnabled")}`,
      flex: 1,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={() => handleToggle(params.row.id, params.value)}
          color="primary"
        />
      ),
    },
    {
      field: "action",
      headerName: `${t("app.actions")}`,
      width: 120,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => handleDelete(params.row.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleVerifiedFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVerifiedFilter(event.target.checked);
  };

  const filteredRows = rows.filter(
    (row) =>
      (row.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!verifiedFilter || row.isVerified)
  );

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data: UserList[] = await fetchUsers();
        const formattedData = data
          // Exclude users with custom:isAdmin true
          .filter(
            (user) =>
              user.Attributes.find((attr) => attr.Name === "custom:isAdmin")
                ?.Value !== "true"
          )
          .map((user) => ({
            id: user.Username,
            username:
              user.Attributes.find((attr) => attr.Name === "preferred_username")
                ?.Value || "N/A",
            email:
              user.Attributes.find((attr) => attr.Name === "email")?.Value ||
              "N/A",
            // Format date as YYYY-MM-DD
            createdDate: new Date(user.UserCreateDate)
              .toISOString()
              .split("T")[0],
            isVerified:
              user.Attributes.find((attr) => attr.Name === "custom:isVerified")
                ?.Value === "true",
          }));
        setRows(formattedData);
      } catch (error: unknown) {
        const err = error as ApiError;
        console.error("Failed to fetch users", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [token]);

  // throwing error so that error boundary handle it
  if (error && error.includes("Network Error")) {
    throw error;
  }

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        p: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? "#fff"
            : theme.palette.background.default,
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, textAlign: "center" }}>
        {t("app.userInformation")}
      </Typography>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TextField
          label={t("app.search")}
          id={t("app.search")}
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": {
                borderRadius: "12px",
              },
            },
            "& .MuiInputLabel-root": {
              fontSize: "0.875rem",
            },
            width: "200px", // Set a specific width
            mr: 2,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body1" sx={{ mr: 1 }}>
            {t("app.enabledOnly")}
          </Typography>
          <Switch
            checked={verifiedFilter}
            onChange={handleVerifiedFilterChange}
            color="primary"
          />
        </Box>
      </Box>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={filteredRows}
          columns={columns}
          paginationModel={{ pageSize: 5, page: 0 }}
          pageSizeOptions={[5, 10, 20]}
          sortModel={[{ field: "createdDate", sort: "desc" }]} // Default sort
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? "#f5f5f5"
                  : theme.palette.background.paper,
              color: (theme) => theme.palette.text.primary,
              textAlign: "left",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: "bold !important",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid",
              borderColor: (theme) => theme.palette.divider,
              textAlign: "left",
            },
            "& .MuiDataGrid-row:nth-of-type(even)": {
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? "#fafafa"
                  : theme.palette.action.hover,
            },
            "& .MuiDataGrid-row:nth-of-type(odd)": {
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? "#fff"
                  : theme.palette.background.default,
            },
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
            },
            "& .MuiDataGrid-scrollArea": {
              overflow: "hidden",
            },
            "& .MuiDataGrid-scrollbar": {
              width: "8px",
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: (theme) => theme.palette.primary.main,
              },
            },
          }}
        />
      )}
      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={cancelDelete}>
        <DialogContent>
          <DialogContentText>{t("app.confirmDeletionText")}</DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button onClick={cancelDelete} variant="outlined">
            {t("app.cancel")}
          </Button>
          <Button
            onClick={confirmDelete}
            autoFocus
            variant="contained"
            color="primary"
          >
            {t("app.confirmDeletion")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
