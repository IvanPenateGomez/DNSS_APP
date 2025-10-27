import {
  getValidColor,
  isValidColor,
  lightenColor,
} from "@/components/new-project helper/colors";
import { useFormState } from "@/components/new-project helper/form";
import {
  ColorPickerModal,
  HexInputModal,
  NameInputModal,
  SelectOptionsModal,
} from "@/components/new-project helper/popups";
import { styles } from "@/components/new-project helper/styles";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Type = "text" | "number" | "boolean" | "date" | "image" | "select";

type Values = {
  id: number;
  name: string;
  valueType: Type;
};

type Attribute = {
  id: number;
  name: string;
  valueType: Type;
  values: Values[];
};

type ObjectItem = {
  id: number;
  name: string;
  color: string;
  attributes: Attribute[];
};

type Props = {
  projectId: number;
  projectName?: string;
};

export default function NewProjectComp({ projectId, projectName }: Props) {
  const [valueModalVisible, setValueModalVisible] = React.useState(false);
  const [editingStates, setEditingStates] = React.useState<{
    [key: number]: { isEditing: boolean; text: string };
  }>({});
  
  const {
    objects,
    inputVisible,
    colorPickerVisible,
    hexInputVisible,
    inputValue,
    addingType,
    tempObjectName,
    colorValue,
    selectOptionsVisible,
    addSelectOption,
    selectValues,
    currentSelectAttributeId, // ✅ add this
    setCurrentSelectAttributeId, // (optional, if you need it)

    setInputValue,
    setColorValue,
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
    updateAttributeValue
  } = useFormState(projectId);

  const insets = useSafeAreaInsets();

  const handleStartSurvey = () => {
    router.push("/(app)/(drawer)/(tabs)/Map");
  };
  const handleOpenValuesModal = (attr: Attribute) => {
    setCurrentSelectAttributeId(attr.id);
    const initial = Object.fromEntries(
      attr.values.map((v) => [v.id, { isEditing: false, text: v.name }])
    );
    setEditingStates(initial);
    setValueModalVisible(true);
  };
  const selectedAttribute =
  objects
    .flatMap((obj) => obj.attributes)
    .find((a) => a.id === currentSelectAttributeId) || null;

  return (
    <View style={[styles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: 300,
        }}
      >
        <Text style={styles.header}>Form Creation</Text>

        {objects.map((obj: ObjectItem) => {
          const lighterColor = lightenColor(obj.color, 40);
          return (
            <View
              key={obj.id}
              style={[styles.objectContainer, { backgroundColor: obj.color }]}
            >
              <View style={styles.objectHeader}>
                <TouchableOpacity
                  style={styles.objectTitleButton}
                  onPress={() => handleChangeObjectName(obj.id)}
                >
                  <Text style={styles.objectTitle}>{obj.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteObjectButton}
                  onPress={() => handleDeleteObject(obj.id)}
                >
                  <Text style={styles.deleteObjectText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Show attributes */}
              {obj.attributes.map((attr: Attribute) => (
                <View
                  key={attr.id}
                  style={[styles.attributeRow, { flexDirection: "column" }]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.attributeBox,
                        { backgroundColor: lighterColor, flex: 1 },
                      ]}
                      onPress={() => handleChangeAttributeName(obj.id, attr.id)}
                    >
                      <Text style={styles.attributeText}>
                        {attr.name}{" "}
                        <Text style={{ fontStyle: "italic", color: "#555" }}>
                          ({attr.valueType})
                        </Text>
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteAttributeButton}
                      onPress={() => handleDeleteAttribute(attr.id)}
                    >
                      <Text style={styles.deleteAttributeText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  {/* List values below the attribute */}
                  {attr.values.length > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenValuesModal(attr)}
                    >
                      <View
                        style={[
                          styles.valueSection,
                          { backgroundColor: lighterColor },
                        ]}
                      >
                        <Text style={styles.valueHeader}>Values:</Text>

                        {attr.values.map((val) => (
                          <View key={val.id} style={styles.valueRow}>
                            <Text style={styles.valueBullet}>•</Text>
                            <Text style={styles.valueText}>
                              {val.name}{" "}
                              <Text
                                style={[
                                  styles.valueType,
                                  val.valueType === "number"
                                    ? styles.valueTypeNumber
                                    : val.valueType === "boolean"
                                    ? styles.valueTypeBool
                                    : val.valueType === "date"
                                    ? styles.valueTypeDate
                                    : val.valueType === "image"
                                    ? styles.valueTypeImage
                                    : val.valueType === "select"
                                    ? styles.valueTypeSelect
                                    : styles.valueTypeText,
                                ]}
                              >
                                ({val.valueType})
                              </Text>
                            </Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.addAttributeButton,
                  { backgroundColor: lighterColor },
                ]}
                onPress={() => handleAddAttribute(obj.id)}
              >
                <Text style={styles.addAttributeText}>+ Add Attribute</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.addObjectButton}
          onPress={handleAddObject}
        >
          <Text style={styles.addObjectText}>+ Add Object</Text>
        </TouchableOpacity>

        {/* Modals */}
        <NameInputModal
          visible={
            inputVisible &&
            (addingType === "object" ||
              addingType === "attribute" ||
              addingType === "editAttribute" ||
              addingType === "editObject")
          }
          addingType={addingType}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onCancel={resetInputModal}
          onConfirm={confirmInput}
          onConfirmObjectName={confirmObjectName}
        />

        <ColorPickerModal
          visible={colorPickerVisible}
          tempObjectName={tempObjectName}
          onSelectColor={selectBasicColor}
          onOpenHexInput={openHexInput}
          onCancel={resetColorModal}
        />

        <HexInputModal
          visible={hexInputVisible}
          tempObjectName={tempObjectName}
          colorValue={colorValue}
          onColorChange={setColorValue}
          isValidColor={isValidColor}
          getValidColor={getValidColor}
          onBack={resetHexModal}
          onConfirm={confirmHexColor}
        />

        <SelectOptionsModal
          visible={selectOptionsVisible}
          onDone={() => setSelectOptionsVisible(false)}
          option={selectValues}
          setOption={setSelectValues}
          handleAdd={() => {
            if (!currentSelectAttributeId || !selectValues.trim()) return;
            addSelectOption(currentSelectAttributeId, selectValues.trim());
            setSelectValues(""); // clear field
          }}
        />

        <View style={[styles.fixedButtonContainer, { bottom: 0 }]}>
          <TouchableOpacity
            style={styles.startSurveyButton}
            onPress={handleStartSurvey}
          >
            <Text style={styles.startSurveyText}>Start Survey</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {valueModalVisible && selectedAttribute && (
  <View
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    }}
  >
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 15,
        width: "90%",
        maxHeight: "80%",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#7a6161ff",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        {selectedAttribute.name} Values
      </Text>

      <ScrollView
        style={{
          borderWidth: 1,
          borderColor: "#e0d6d6",
          borderRadius: 10,
          backgroundColor: "#f8f6f6",
          maxHeight: 380,
        }}
        contentContainerStyle={{ paddingVertical: 6 }}
      >
        {selectedAttribute.values.map((val) => {
          const state = editingStates[val.id];
          const isEditing = state?.isEditing ?? false;
          const text = state?.text ?? val.name;

          return (
            <View
              key={val.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {isEditing ? (
                  <TextInput
                    value={text}
                    onChangeText={(t) =>
                      setEditingStates((prev) => ({
                        ...prev,
                        [val.id]: { ...prev[val.id], text: t },
                      }))
                    }
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      fontSize: 14,
                      color: "#333",
                    }}
                  />
                ) : (
                  <>
                    <Text style={{ fontSize: 14, color: "#544141ff" }}>
                      {text}
                    </Text>
            
                  </>
                )}
              </View>

              {/* Right-side actions */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                {isEditing ? (
                  <TouchableOpacity
                  hitSlop={15}
                  onPress={async () => {
                    if (!selectedAttribute) return;
                    for (const val of selectedAttribute.values) {
                      const newText = editingStates[val.id]?.text ?? val.name;
                      if (newText !== val.name) {
                        await updateAttributeValue(val.id, newText);
                      }
                    }
                    console.log("✅ Saved all updated values to DB");
                    setValueModalVisible(false);
                  }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: "#007a5a", fontWeight: "600" }}>Save</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity    hitSlop={15}
                    onPress={() =>
                      setEditingStates((prev) => ({
                        ...prev,
                        [val.id]: { ...prev[val.id], isEditing: true },
                      }))
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: "#2E6EF0", fontWeight: "600" }}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity    hitSlop={15}
                  onPress={() => console.log("Delete value:", val)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "#b43333", fontWeight: "600" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 18,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => setValueModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "lightgrey",
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#555", fontWeight: "600" }}>Close</Text>
        </TouchableOpacity>


      </View>
    </View>
  </View>
)}


    </View>
  );
}
