import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { AttributeService } from "./attributes";
import { isValidColor } from "./colors";
import { ObjectService } from "./objects";
import { useSQLiteContext } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { attributes, objectTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useProjectSync } from "@/hooks/useProjectSync";

export type ValueType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "image"
  | "select";

export interface ValueItem {
  id: number;
  name: string;
  valueType: ValueType;
}

export interface Attribute {
  id: number;
  name: string;
  valueType: ValueType;
  values: ValueItem[];
}

export interface ObjectItem {
  id: number;
  name: string;
  color: string;
  attributes: Attribute[];
}

export type AddingType =
  | "object"
  | "attribute"
  | "editAttribute"
  | "editObject";


  export const useFormState = (projectId: number) => {
  //  Hooks for database
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);

  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [inputVisible, setInputVisible] = useState<boolean>(false);
  const [colorPickerVisible, setColorPickerVisible] = useState<boolean>(false);
  const [hexInputVisible, setHexInputVisible] = useState<boolean>(false);
  const [currentObjectId, setCurrentObjectId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [colorValue, setColorValue] = useState<string>("");
  const [addingType, setAddingType] = useState<AddingType>("object");
  const [tempObjectName, setTempObjectName] = useState<string>("");
  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(
    null
  );
  const [selectedValueType, setSelectedValueType] = useState<ValueType>();
  const [selectOptionsVisible, setSelectOptionsVisible] = useState(false);
  const [currentSelectAttributeId, setCurrentSelectAttributeId] = useState<
    number | null
  >(null);
  const [selectValues, setSelectValues] = useState<string>("");
  const [currentObjectIdSelect, setCurrentObjectIdSelect] = useState<
    number | null
  >(null);

  useProjectSync(projectId, objects, setObjects);

  // --- Add / Update / Delete logic remains unchanged ---
  const addObject = (name: string, color: string): void => {
    setObjects((prev) => ObjectService.addObject(prev, name, color));
  };

  const updateObjectName = (objectId: number, newName: string): void => {
    setObjects((prev) => ObjectService.updateObjectName(prev, objectId, newName));
  };

  const deleteObject = (objectId: number): void => {
    setObjects((prev) => ObjectService.deleteObject(prev, objectId));
  };


  const addAttribute = (
    objectId: number,
    attributeName: string,
    valueType: ValueType
  ): number => {
    let newAttrId = Date.now();
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === objectId
          ? {
              ...obj,
              attributes: [
                ...obj.attributes,
                {
                  id: newAttrId,
                  name: attributeName,
                  valueType,
                  values: [],
                },
              ],
            }
          : obj
      )
    );
    return newAttrId;
  };

  const updateAttribute = (
    objectId: number,
    attributeId: number,
    newName: string
  ): void => {
    setObjects((prev) =>
      AttributeService.updateAttribute(prev, objectId, attributeId, newName)
    );
  };

  const deleteAttribute = (objectId: number, attributeId: number): void => {
    setObjects((prev) =>
      AttributeService.deleteAttribute(prev, objectId, attributeId)
    );
  };

  const findObject = (objectId: number): ObjectItem | undefined =>
    ObjectService.findObject(objects, objectId);

  const findAttribute = (
    objectId: number,
    attributeId: number
  ): Attribute | undefined =>
    ObjectService.findAttribute(objects, objectId, attributeId);

  const handleAddObject = (): void => {
    if (Platform.OS === "ios" && Alert.prompt) {
      Alert.prompt("New Object", "Enter the name of the object:", (name) => {
        if (!name) return;
        Alert.prompt(
          "Object Color",
          "Enter a hex color (e.g., #FF5733):",
          (color) => {
            if (!color || !isValidColor(color)) {
              Alert.alert(
                "Invalid Color",
                "Please enter a valid hex color (e.g., #FF5733)"
              );
              return;
            }
            addObject(name, color.toUpperCase());
          }
        );
      });
    } else {
      setAddingType("object");
      setInputValue("");
      setInputVisible(true);
    }
  };

  const handleAddAttribute = (objectId: number): void => {
    const typeOptions: ValueType[] = ["boolean", "select"];

    Alert.alert(
      "Select Attribute Type",
      "Choose a value type for this attribute:",
      typeOptions.map((type) => ({
        text: type,
        onPress: () => {
          console.log("Selected type:", objectId);
          setCurrentObjectId(objectId);
          setSelectedValueType(type);
          setAddingType("attribute");
          setInputValue("");
          setInputVisible(true);
        },
      }))
    );
  };

  const addSelectOption = () => {
    console.log("ADDING SELECT OPTION:", selectValues);
    if (
      !currentObjectIdSelect ||
      !currentSelectAttributeId ||
      !selectValues.trim()
    ) {
      console.log(
        "Cannot add option, missing data",
        currentObjectIdSelect,
        currentSelectAttributeId,
        selectValues
      );
      return;
    }

    setObjects((prev) =>
      prev.map((obj) => {
        if (obj.id !== currentObjectIdSelect) return obj;
        return {
          ...obj,
          attributes: obj.attributes.map((attr) => {
            if (attr.id !== currentSelectAttributeId) return attr;
            return {
              ...attr,
              values: [
                ...attr.values,
                { id: Date.now(), name: selectValues, valueType: "text" },
              ],
            };
          }),
        };
      })
    );

    setSelectValues(""); // clear input for next option
  };

  const handleDeleteObject = (objectId: number): void => {
    Alert.alert(
      "Delete Object",
      "Are you sure you want to delete this object and all its attributes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteObject(objectId),
        },
      ]
    );
  };

  const handleDeleteAttribute = (
    objectId: number,
    attributeId: number
  ): void => {
    Alert.alert(
      "Delete Attribute",
      "Are you sure you want to delete this attribute?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAttribute(objectId, attributeId),
        },
      ]
    );
  };

  const handleChangeAttributeName = (
    objectId: number,
    attributeId: number
  ): void => {
    const attribute = findAttribute(objectId, attributeId);
    if (attribute) {
      setInputValue(attribute.name);
      setCurrentObjectId(objectId);
      setAddingType("editAttribute");
      setEditingAttributeId(attributeId);
      setInputVisible(true);
    }
  };

  const handleChangeObjectName = (objectId: number): void => {
    const object = findObject(objectId);
    if (object) {
      setInputValue(object.name);
      setCurrentObjectId(objectId);
      setAddingType("editObject");
      setInputVisible(true);
    }
  };

  const confirmObjectName = (): void => {
    if (!inputValue.trim()) return;
    setTempObjectName(inputValue);
    setInputValue("");
    setInputVisible(false);
    setColorPickerVisible(true);
  };

  const selectBasicColor = (color: string): void => {
    addObject(tempObjectName, color);
    setColorPickerVisible(false);
    setTempObjectName("");
  };

  const openHexInput = (): void => {
    setColorPickerVisible(false);
    setHexInputVisible(true);
  };

  const confirmHexColor = (): void => {
    let finalColor = colorValue;
    if (colorValue && !colorValue.startsWith("#")) {
      finalColor = "#" + colorValue;
    }

    if (!finalColor.trim() || !isValidColor(finalColor)) {
      Alert.alert(
        "Invalid Color",
        "Please enter a valid hex color (e.g., FF5733 or #FF5733)"
      );
      return;
    }

    addObject(tempObjectName, finalColor.toUpperCase());
    setColorValue("");
    setHexInputVisible(false);
    setTempObjectName("");
  };

  const confirmInput = (): void => {
    if (!inputValue.trim()) return;

    if (addingType === "attribute") {
      const newAttrId = addAttribute(
        currentObjectId!,
        inputValue,
        selectedValueType!
      );

      if (selectedValueType === "select") {
        setCurrentSelectAttributeId(newAttrId);
        setSelectValues("");
        setSelectOptionsVisible(true);
        setCurrentObjectIdSelect(currentObjectId);
      }
    } else if (addingType === "editAttribute") {
      updateAttribute(currentObjectId!, editingAttributeId!, inputValue);
    } else if (addingType === "editObject") {
      updateObjectName(currentObjectId!, inputValue);
    }

    setInputValue("");
    setInputVisible(false);
    setCurrentObjectId(null);
    setEditingAttributeId(null);
  };

  const resetInputModal = (): void => {
    setInputVisible(false);
    setInputValue("");
    setCurrentObjectId(null);
    setEditingAttributeId(null);
  };

  const resetColorModal = (): void => {
    setColorPickerVisible(false);
    setTempObjectName("");
  };

  const resetHexModal = (): void => {
    setHexInputVisible(false);
    setColorValue("");
    setColorPickerVisible(true);
  };

  return {
    objects,
    inputVisible,
    colorPickerVisible,
    hexInputVisible,
    currentObjectId,
    inputValue,
    colorValue,
    addingType,
    tempObjectName,
    editingAttributeId,
    selectOptionsVisible,
    addSelectOption,
    selectValues,

    setInputVisible,
    setColorPickerVisible,
    setHexInputVisible,
    setCurrentObjectId,
    setInputValue,
    setColorValue,
    setAddingType,
    setTempObjectName,
    setEditingAttributeId,
    setObjects,
    setSelectOptionsVisible,
    setSelectValues,

    handleAddObject,
    handleAddAttribute,
    handleDeleteObject,
    handleDeleteAttribute,
    handleChangeAttributeName,
    handleChangeObjectName,
    confirmObjectName,
    selectBasicColor,
    openHexInput,
    confirmHexColor,
    confirmInput,
    resetInputModal,
    resetColorModal,
    resetHexModal,
  };
};
