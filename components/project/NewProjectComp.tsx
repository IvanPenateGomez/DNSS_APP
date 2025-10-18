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
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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

    setInputValue,
    setColorValue,
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
  } = useFormState(projectId);

  const insets = useSafeAreaInsets();

  const handleStartSurvey = () => {
    router.push("/(app)/(drawer)/(tabs)/Map");
  };

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
              {obj.attributes.map(
                (attr: Attribute) => (
               
                  (
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
                          onPress={() =>
                            handleChangeAttributeName(obj.id, attr.id)
                          }
                        >
                          <Text style={styles.attributeText}>
                            {attr.name}{" "}
                            <Text
                              style={{ fontStyle: "italic", color: "#555" }}
                            >
                              ({attr.valueType})
                            </Text>
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteAttributeButton}
                          onPress={() => handleDeleteAttribute(obj.id, attr.id)}
                        >
                          <Text style={styles.deleteAttributeText}>×</Text>
                        </TouchableOpacity>
                      </View>

                      {/* List values below the attribute */}
                      {attr.values.length > 0 &&
                        (
                        (
                          <View style={{ marginTop: 5, marginLeft: 10 }}>
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#666",
                                fontWeight: "600",
                              }}
                            >
                              Values:
                            </Text>
                            {attr.values.map((val) => (
                              <Text
                                key={val.id}
                                style={{ fontSize: 12, color: "#444" }}
                              >
                                • {val.name} ({val.valueType})
                              </Text>
                            ))}
                          </View>
                        ))}
                    </View>
                  )
                )
              )}

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
          handleAdd={addSelectOption}
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
    </View>
  );
}
