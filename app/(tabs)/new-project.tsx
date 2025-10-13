import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
} from "@/components/new-project helper/popups";
import { styles } from "@/components/new-project helper/styles";

export default function NewProjectScreen() {
  const router = useRouter();
  const {
    objects,
    inputVisible,
    colorPickerVisible,
    hexInputVisible,
    inputValue,
    addingType,
    tempObjectName,
    colorValue,

    // Setters
    setInputValue,
    setColorValue,

    // Event Handlers
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
  } = useFormState();

  const handleStartSurvey = () => {
    console.log("Starting survey with objects:", objects);
    router.push("/(tabs)/survey");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.header}>Form Creation</Text>

        {objects.map((obj) => {
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

              {obj.attributes.map((attr) => (
                <View key={attr.id} style={styles.attributeRow}>
                  <TouchableOpacity
                    style={[
                      styles.attributeBox,
                      { backgroundColor: lighterColor },
                    ]}
                    onPress={() => handleChangeAttributeName(obj.id, attr.id)}
                  >
                    <Text style={styles.attributeText}>{attr.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteAttributeButton}
                    onPress={() => handleDeleteAttribute(obj.id, attr.id)}
                  >
                    <Text style={styles.deleteAttributeText}>×</Text>
                  </TouchableOpacity>
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
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.startSurveyButton}
          onPress={handleStartSurvey}
        >
          <Text style={styles.startSurveyText}>Start Survey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
