// hooks/useFormState.ts
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { openDatabaseSync, useSQLiteContext } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { eq, desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { objectTypes, attributes, attributeValues } from "@/db/schema";
import { isValidColor } from "./colors";
import { DATABASE_NAME } from "@/app/_layout";

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
  const expoDb = openDatabaseSync(DATABASE_NAME, {
    useNewConnection: true,
  });
  const db = drizzle(expoDb);
  const refreshDB = useRefreshDbStore((s) => s.refreshDB);

  // UI state
  const [inputVisible, setInputVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [hexInputVisible, setHexInputVisible] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [colorValue, setColorValue] = useState("");
  const [addingType, setAddingType] = useState<AddingType>("object");
  const [tempObjectName, setTempObjectName] = useState("");
  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(
    null
  );
  const [selectedValueType, setSelectedValueType] = useState<ValueType>();
  const [selectOptionsVisible, setSelectOptionsVisible] = useState(false);
  const [currentSelectAttributeId, setCurrentSelectAttributeId] = useState<
    number | null
  >(null);
  const [selectValues, setSelectValues] = useState("");
  const [currentObjectIdSelect, setCurrentObjectIdSelect] = useState<
    number | null
  >(null);

  /* ───────────────────────────────
   *  Live Queries
   * ─────────────────────────────── */
  const { data: objectRows } = useLiveQuery(
    db
      .select()
      .from(objectTypes)
      .where(eq(objectTypes.project_id, projectId))
      .orderBy(desc(objectTypes.order_index)),
    [projectId, refreshDB]
  );

  const { data: attributeRows } = useLiveQuery(db.select().from(attributes), [
    refreshDB,
  ]);

  const { data: valueRows } = useLiveQuery(db.select().from(attributeValues), [
    refreshDB,
  ]);

  const refresh = () => useRefreshDbStore.getState().increment();

  // Build hierarchy
  const objects: ObjectItem[] = (objectRows ?? []).map((obj) => ({
    id: obj.id,
    name: obj.name,
    color: obj.color ?? "#CCCCCC",
    attributes: (attributeRows ?? [])
      .filter((a) => a.object_type_id === obj.id)
      .map((attr) => ({
        id: attr.id,
        name: attr.label,
        valueType: attr.type as ValueType,
        values: (valueRows ?? [])
          .filter((v) => v.attribute_id === attr.id)
          .map((v) => ({
            id: v.id,
            name: v.value_text ?? "",
            valueType: attr.type as ValueType,
          })),
      })),
  }));

  /* ───────────────────────────────
   *  DB Actions
   * ─────────────────────────────── */

  const addObject = async (name: string, color: string) => {
    await db.insert(objectTypes).values({
      project_id: projectId,
      name,
      color,
      order_index: (objectRows?.length ?? 0) + 1,
    });
    refresh();
  };

  const updateObjectName = async (objectId: number, newName: string) => {
    await db
      .update(objectTypes)
      .set({ name: newName })
      .where(eq(objectTypes.id, objectId));
    refresh();
  };

  const deleteObject = async (objectId: number) => {
    await db.delete(objectTypes).where(eq(objectTypes.id, objectId));
    refresh();
  };

  const reorderObjects = async (orderedIds: number[]) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(objectTypes)
        .set({ order_index: i })
        .where(eq(objectTypes.id, orderedIds[i]));
    }
    refresh();
  };

  // 🟢 Return ID for popup
  const addAttribute = async (
    objectId: number,
    name: string,
    type: ValueType
  ) => {
    const res = await db
      .insert(attributes)
      .values({
        object_type_id: objectId,
        label: name,
        key: name.toLowerCase().replace(/\s+/g, "_"),
        type,
        required: false,
        order_index: 0,
      })
      .run();

    const newAttrId = Number((res as any)?.lastInsertRowId ?? 0);
    refresh();
    return newAttrId;
  };

  const updateAttributeName = async (attributeId: number, newName: string) => {
    await db
      .update(attributes)
      .set({
        label: newName,
        key: newName.toLowerCase().replace(/\s+/g, "_"),
      })
      .where(eq(attributes.id, attributeId));
    refresh();
  };

  const deleteAttribute = async (attributeId: number) => {
    await db.delete(attributes).where(eq(attributes.id, attributeId));
    refresh();
  };

  const addSelectOption = async (attributeId: number, name: string) => {
    if (!name.trim()) return;
    await db
      .insert(attributeValues)
      .values({ attribute_id: attributeId, value_text: name });
    refresh();
  };

  /* ───────────────────────────────
   *  Handlers / Modals
   * ─────────────────────────────── */

  const handleAddObject = () => {
    if (Platform.OS === "ios" && Alert.prompt) {
      Alert.prompt("New Object", "Enter name:", (name) => {
        if (!name) return;
        Alert.prompt("Color", "Enter hex (e.g. #FF5733):", (color) => {
          if (!color || !isValidColor(color)) {
            Alert.alert("Invalid", "Please enter valid hex");
            return;
          }
          addObject(name, color.toUpperCase());
        });
      });
    } else {
      setAddingType("object");
      setInputValue("");
      setInputVisible(true);
    }
  };

  const handleAddAttribute = (objectId: number) => {
    const typeOptions: ValueType[] = ["boolean", "select"];
    Alert.alert(
      "Select Attribute Type",
      "Choose value type:",
      typeOptions.map((type) => ({
        text: type,
        onPress: () => {
          setCurrentObjectId(objectId);
          setSelectedValueType(type);
          setAddingType("attribute");
          setInputVisible(true);
        },
      }))
    );
  };

  const handleDeleteObject = (objectId: number) => {
    Alert.alert("Delete Object?", "This will remove all attributes.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteObject(objectId),
      },
    ]);
  };

  const handleDeleteAttribute = (attributeId: number) => {
    Alert.alert("Delete Attribute?", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAttribute(attributeId),
      },
    ]);
  };

  const confirmObjectName = () => {
    if (!inputValue.trim()) return;
    setTempObjectName(inputValue);
    setInputValue("");
    setInputVisible(false);
    setColorPickerVisible(true);
  };

  const selectBasicColor = (color: string) => {
    addObject(tempObjectName, color);
    setColorPickerVisible(false);
    setTempObjectName("");
  };

  const openHexInput = () => {
    setColorPickerVisible(false);
    setHexInputVisible(true);
  };

  const confirmHexColor = () => {
    let finalColor = colorValue;
    if (colorValue && !colorValue.startsWith("#")) finalColor = "#" + colorValue;
    if (!finalColor.trim() || !isValidColor(finalColor)) {
      Alert.alert("Invalid Color", "Please enter valid hex");
      return;
    }
    addObject(tempObjectName, finalColor.toUpperCase());
    setColorValue("");
    setHexInputVisible(false);
    setTempObjectName("");
  };

  // 🟢 Now re-enabled select popup flow
  const confirmInput = async () => {
    if (!inputValue.trim()) return;

    if (addingType === "attribute") {
      const newAttrId = await addAttribute(
        currentObjectId!,
        inputValue,
        selectedValueType!
      );

      if (selectedValueType === "select" && newAttrId) {
        setCurrentSelectAttributeId(newAttrId);
        setSelectValues("");
        setSelectOptionsVisible(true);
        setCurrentObjectIdSelect(currentObjectId);
      }
    } else if (addingType === "editAttribute") {
      await updateAttributeName(editingAttributeId!, inputValue);
    } else if (addingType === "editObject") {
      await updateObjectName(currentObjectId!, inputValue);
    }

    setInputVisible(false);
    setInputValue("");
    setEditingAttributeId(null);
    setCurrentObjectId(null);
  };

  const resetInputModal = () => {
    setInputVisible(false);
    setInputValue("");
    setCurrentObjectId(null);
    setEditingAttributeId(null);
  };

  const resetColorModal = () => {
    setColorPickerVisible(false);
    setTempObjectName("");
  };

  const resetHexModal = () => {
    setHexInputVisible(false);
    setColorValue("");
    setColorPickerVisible(true);
  };

  const handleChangeAttributeName = (objectId: number, attributeId: number) => {
    // Find the attribute
    const obj = objects.find((o) => o.id === objectId);
    const attr = obj?.attributes.find((a) => a.id === attributeId);
  
    if (attr) {
      setInputValue(attr.name);
      setCurrentObjectId(objectId);
      setAddingType("editAttribute");
      setEditingAttributeId(attributeId);
      setInputVisible(true);
    }
  };
  
  const handleChangeObjectName = (objectId: number) => {
    const obj = objects.find((o) => o.id === objectId);
    if (obj) {
      setInputValue(obj.name);
      setCurrentObjectId(objectId);
      setAddingType("editObject");
      setInputVisible(true);
    }
  };

  const updateAttributeValue = async (valueId: number, newName: string) => {
    if (!newName.trim()) return;

    await db
      .update(attributeValues)
      .set({ value_text: newName })
      .where(eq(attributeValues.id, valueId));

    refresh();
  };

  
  return {
    objects,

    // UI state
    inputVisible,
    colorPickerVisible,
    hexInputVisible,
    selectOptionsVisible,
    currentObjectId,
    inputValue,
    colorValue,
    addingType,
    tempObjectName,
    editingAttributeId,
    selectValues,

    // Setters
    setInputVisible,
    setColorPickerVisible,
    setHexInputVisible,
    setInputValue,
    setColorValue,
    setAddingType,
    setTempObjectName,
    setEditingAttributeId,
    setSelectOptionsVisible,
    setSelectValues,

    // DB functions
    addObject,
    updateObjectName,
    deleteObject,
    reorderObjects,
    addAttribute,
    updateAttributeName,
    deleteAttribute,
    addSelectOption,
    handleChangeObjectName,
    currentSelectAttributeId, // ✅ add this
    setCurrentSelectAttributeId,

    handleChangeAttributeName,

    // Handlers
    handleAddObject,
    handleAddAttribute,
    handleDeleteObject,
    handleDeleteAttribute,
    confirmObjectName,
    selectBasicColor,
    openHexInput,
    confirmHexColor,
    confirmInput,
    resetInputModal,
    resetColorModal,
    resetHexModal,
    updateAttributeValue
  };
};
