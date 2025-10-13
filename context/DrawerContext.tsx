import React, { createContext, useContext, useState, ReactNode } from "react";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";

export type DrawerItem<T = any> = {
  items: T[];
  onItemPress: (item: T) => void;
};

export type DrawerContextType<T = any, M = any> = {
  drawerData: DrawerItem<T>;
  setDrawerData: React.Dispatch<React.SetStateAction<DrawerItem<T>>>;
  meta?: M;
  setMeta?: React.Dispatch<React.SetStateAction<M>>;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function useDrawer<T = any, M = any>() {
  const context = useContext(DrawerContext) as DrawerContextType<T, M>;
  if (!context)
    throw new Error("useDrawer must be used within a DrawerProvider");
  return context;
}

interface DrawerProviderProps<T = any, M = any> {
  children: ReactNode;
  initialData?: DrawerItem<T>;
  initialMeta?: M;
}

export function DrawerProvider<T = any, M = any>({
  children,
  initialData,
  initialMeta,
}: DrawerProviderProps<T, M>) {
  const navigation = useNavigation();
  const [drawerData, setDrawerData] = useState<DrawerItem<T>>(
    initialData || { items: [], onItemPress: () => {} }
  );
  const [meta, setMeta] = useState<M | undefined>(initialMeta);

  // 🚀 Drawer control methods
  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const closeDrawer = () => navigation.dispatch(DrawerActions.closeDrawer());
  const toggleDrawer = () => navigation.dispatch(DrawerActions.toggleDrawer());

  return (
    <DrawerContext.Provider
      value={{
        drawerData,
        setDrawerData,
        meta,
        setMeta,
        openDrawer,
        closeDrawer,
        toggleDrawer,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export default DrawerProvider;
