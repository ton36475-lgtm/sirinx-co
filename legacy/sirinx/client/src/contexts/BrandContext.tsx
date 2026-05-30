/**
 * BrandContext — React context for accessing brand configuration
 * 
 * Provides brand-specific content (name, logo, contact, solutions, etc.)
 * to all components via useBrand() hook.
 * 
 * Currently loads the SIRINX brand config statically.
 * In a multi-brand deployment, this would read from env or domain detection.
 */
import { createContext, useContext, type ReactNode } from "react";
import sirinxConfig from "../../../brands/sirinx/config";
import type { BrandConfig } from "../../../brands/sirinx/config";

export type { BrandConfig };

const BrandContext = createContext<BrandConfig>(sirinxConfig);

interface BrandProviderProps {
  children: ReactNode;
  brandOverride?: BrandConfig;
}

/**
 * BrandProvider wraps the app and provides brand config to all children.
 * 
 * Usage:
 *   <BrandProvider>
 *     <App />
 *   </BrandProvider>
 * 
 * Or with a specific brand:
 *   <BrandProvider brandOverride={customBrandConfig}>
 *     <App />
 *   </BrandProvider>
 */
export function BrandProvider({ children, brandOverride }: BrandProviderProps) {
  const config = brandOverride || sirinxConfig;
  return (
    <BrandContext.Provider value={config}>
      {children}
    </BrandContext.Provider>
  );
}

/**
 * useBrand — access the current brand configuration from any component.
 * 
 * Example:
 *   const brand = useBrand();
 *   <img src={brand.logo} alt={brand.name} />
 *   <p>{brand.contact.phone}</p>
 */
export function useBrand(): BrandConfig {
  return useContext(BrandContext);
}

export default BrandProvider;
