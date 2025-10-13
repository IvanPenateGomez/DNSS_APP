import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export type IconKeys = "home" | "Map" | "newProject";

const navigationButtonSize = 26;

export const icons = {
  index: (props: any) => (
    <MaterialCommunityIcons
      name="signature-freehand"
      size={navigationButtonSize}
      {...props}
    />
  ),
  Map: (props: any) => (
    <Feather name="home" size={navigationButtonSize} {...props} />
  ),
  newProject: (props: any) => (
    <Feather name="settings" size={navigationButtonSize} {...props} />
  ),
};
