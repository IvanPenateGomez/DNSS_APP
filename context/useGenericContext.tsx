import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * A generic context provider template.
 * Replace <T> with the specific type you need for your context.
 */
export interface GenericContextType<T> {
  value: T | null;
  setValue: (newValue: T | null) => void;
  isLoaded: boolean;
}

// 1️⃣ Create context
const GenericContext = createContext<GenericContextType<any> | undefined>(
  undefined
);

// 2️⃣ Hook for easy access
export function useGenericContext<T>(): GenericContextType<T> {
  const context = useContext(GenericContext);
  if (!context) {
    throw new Error("useGenericContext must be used within a GenericProvider");
  }
  return context;
}

// 3️⃣ Provider factory — so you can create typed providers dynamically
export function createGenericProvider<T>(
  storageKey?: string,
  initialLoader?: () => Promise<T | null>
) {
  return function GenericProvider({ children }: { children: ReactNode }) {
    const [value, setValue] = useState<T | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);



    return (
      <GenericContext.Provider value={{ value, setValue, isLoaded }}>
        {children}
      </GenericContext.Provider>
    );
  };
}
