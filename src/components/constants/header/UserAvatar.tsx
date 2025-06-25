import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound } from "lucide-react";

interface UserAvatarProps {
  user: any;
  size?: "sm" | "md" | "lg";
}

export const UserAvatar = ({ user, size = "md" }: UserAvatarProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Avatar className={sizeClasses[size]}>
      {user?.profilePicture ? (
        <AvatarImage
          className="object-cover"
          src={user.profilePicture}
          alt={user.firstName || "User"}
        />
      ) : (
        <AvatarFallback className="text-sm">
          {user ? (
            `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` ||
            user.email.charAt(0).toUpperCase()
          ) : (
            <UserRound size={16} />
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
};
