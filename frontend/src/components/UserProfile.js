import { useAuth } from "../auth/AuthContext";
import { Avatar, CircularProgress, Box } from "@mui/material";

export default function UserProfile() {
  const { user, loading: authLoading } = useAuth();

  // Global user state is still resolving
  if (authLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={16} /> <span>Checking user…</span>
      </Box>
    );
  }

  // Not logged in
  if (!user) return null;

  // Extract user data from JWT token
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username || user.email || user.sub;
  
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : (user.username || user.email || user.sub || "U").slice(0, 1);

  // Normal render
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar sx={{ width: 32, height: 32 }}>
        {initials.toUpperCase()}
      </Avatar>
      <span>{displayName}</span>
    </Box>
  );
}
