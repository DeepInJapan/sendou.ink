import clsx from "clsx";
import type { User } from "~/db/types";

const dimensions = {
  sm: 44,
  md: 81,
  lg: 125,
};

export function Avatar({
  discordId,
  discordAvatar,
  size = "sm",
  className,
  ...rest
}: Pick<User, "discordId" | "discordAvatar"> & {
  className?: string;
  size: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLImageElement>) {
  // TODO: just show text... my profile?
  // TODO: also show this if discordAvatar is stale and 404's

  return (
    <img
      className={clsx("avatar", className)}
      src={
        discordAvatar
          ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png${
              size === "lg" ? "" : "?size=80"
            }`
          : "/img/blank.gif" // avoid broken image placeholder
      }
      alt=""
      width={dimensions[size]}
      height={dimensions[size]}
      {...rest}
    />
  );
}