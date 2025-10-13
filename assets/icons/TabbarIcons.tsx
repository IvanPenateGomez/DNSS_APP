import { Feather } from "@expo/vector-icons";

export type IconKeys = "home" | "Map" | "newProject";

const navigationButtonSize = 26;

export const icons = {
  index: (props: any) => (
    <Feather name="home" size={navigationButtonSize} {...props} />
  ),
  Map: (props: any) => (
    <Feather name="map" size={navigationButtonSize} {...props} />
  ),
  newProject: (props: any) => (
    <Feather name="file-plus" size={navigationButtonSize} {...props} />
  ),
};
