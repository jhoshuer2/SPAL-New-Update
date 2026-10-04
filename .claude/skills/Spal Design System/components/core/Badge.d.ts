import * as React from "react";
export interface BadgeProps {
  label: string;
  color?: "green" | "orange" | "blue" | "purple" | "gray" | "red";
  dot?: boolean;
  size?: "sm" | "md";
}
export declare function Badge(props: BadgeProps): JSX.Element;
