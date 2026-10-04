import * as React from "react";
/**
 * Intentional addition, DESIGN.md defines a full "proprietary geometric symbol system" (the brand's
 * recognizable signature) but ships no code for it yet. This component operationalizes that spec.
 */
export interface SpalSymbolProps {
  symbol?: "profit" | "flow" | "growth" | "focus" | "consistency" | "momentum" | "insight" | "cashflow";
  color?: string;
  size?: number;
  spin?: boolean;
}
export declare function SpalSymbol(props: SpalSymbolProps): JSX.Element;
