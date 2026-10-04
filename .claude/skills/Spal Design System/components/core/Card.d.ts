import * as React from "react";
export interface CardProps {
  accent?: "green" | "blue" | "orange" | "purple" | "none";
  padding?: "sm" | "md" | "lg" | "none";
  elevated?: boolean;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
