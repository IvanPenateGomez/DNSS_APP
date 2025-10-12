import React from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';

import { useFormState } from './new-project helper/form';
import { lightenColor, isValidColor, getValidColor } from './new-project helper/colors';
import { 
  NameInputModal, 
  ColorPickerModal, 
  HexInputModal 
} from './new-project helper/popups';

export default function NewProjectScreen() {
  const router = useRouter();
  const {
    // State
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
    
    // Setters
    setInputVisible,
    setColorPickerVisible,
    setHexInputVisible,
    setCurrentObjectId,
    setInputValue,
    setColorValue,
    setAddingType,
    setTempObjectName,
    setEditingAttributeId,
    
    // Actions
    addObject,
    updateObjectName,
    deleteObject,
    addAttribute,
    updateAttribute,
    deleteAttribute,
    findObject,
    findAttribute
  } = useFormState();

  const handleAddObject = () => {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('New Object', 'Enter the name of the object:', (name) => {
        if (!name) return;
        Alert.prompt('Object Color', 'Enter a hex color (e.g., #FF5733):', (color) => {
          if (!color || !isValidColor(color)) {
            Alert.alert('Invalid Color', 'Please enter a valid hex color (e.g., #FF5733)');
            return;
          }
          addObject(name, color.toUpperCase());
        });
      });
    } else {
      setAddingType('object');
      setInputValue('');
      setInputVisible(true);
    }
  };

  const handleAddAttribute = (objectId) => {
    setAddingType('attribute');
    setCurrentObjectId(objectId);
    setInputValue('');
    setInputVisible(true);
  };

  const handleDeleteObject = (objectId) => {
    Alert.alert(
      'Delete Object',
      'Are you sure you want to delete this object and all its attributes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteObject(objectId)
        }
      ]
    );
  };

  const handleDeleteAttribute = (objectId, attributeId) => {
    Alert.alert(
      'Delete Attribute',
      'Are you sure you want to delete this attribute?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteAttribute(objectId, attributeId)
        }
      ]
    );
  };

  const handleChangeAttributeName = (objectId, attributeId) => {
    const attribute = findAttribute(objectId, attributeId);
    if (attribute) {
      setInputValue(attribute.name);
      setCurrentObjectId(objectId);
      setAddingType('editAttribute');
      setEditingAttributeId(attributeId);
      setInputVisible(true);
    }
  };

  const handleChangeObjectName = (objectId) => {
    const object = findObject(objectId);
    if (object) {
      setInputValue(object.name);
      setCurrentObjectId(objectId);
      setAddingType('editObject');
      setInputVisible(true);
    }
  };

  const confirmObjectName = () => {
    if (!inputValue.trim()) return;
    setTempObjectName(inputValue);
    setInputValue('');
    setInputVisible(false);
    setColorPickerVisible(true);
  };

  const selectBasicColor = (color) => {
    addObject(tempObjectName, color);
    setColorPickerVisible(false);
    setTempObjectName('');
  };

  const openHexInput = () => {
    setColorPickerVisible(false);
    setHexInputVisible(true);
  };

  const confirmHexColor = () => {
    let finalColor = colorValue;
    if (colorValue && !colorValue.startsWith('#')) {
      finalColor = '#' + colorValue;
    }
    
    if (!finalColor.trim() || !isValidColor(finalColor)) {
      Alert.alert('Invalid Color', 'Please enter a valid hex color (e.g., FF5733 or #FF5733)');
      return;
    }
    
    addObject(tempObjectName, finalColor.toUpperCase());
    setColorValue('');
    setHexInputVisible(false);
    setTempObjectName('');
  };

  const confirmInput = () => {
    if (!inputValue.trim()) return;
    
    if (addingType === 'attribute') {
      addAttribute(currentObjectId, inputValue);
    } else if (addingType === 'editAttribute') {
      updateAttribute(currentObjectId, editingAttributeId, inputValue);
    } else if (addingType === 'editObject') {
      updateObjectName(currentObjectId, inputValue);
    }
    
    setInputValue('');
    setInputVisible(false);
    setCurrentObjectId(null);
    setEditingAttributeId(null);
  };

  const handleStartSurvey = () => {
    console.log('Starting survey with objects:', objects);
    router.push('/(tabs)/survey');
  };

  const resetInputModal = () => {
    setInputVisible(false);
    setInputValue('');
    setCurrentObjectId(null);
    setEditingAttributeId(null);
  };

  const resetColorModal = () => {
    setColorPickerVisible(false);
    setTempObjectName('');
  };

  const resetHexModal = () => {
    setHexInputVisible(false);
    setColorValue('');
    setColorPickerVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.header}>Form Creation</Text>

        {objects.map((obj) => {
          const lighterColor = lightenColor(obj.color, 40);
          return (
            <View 
              key={obj.id} 
              style={[
                styles.objectContainer,
                { backgroundColor: obj.color }
              ]}
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
                      { backgroundColor: lighterColor }
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
                  { backgroundColor: lighterColor }
                ]}
                onPress={() => handleAddAttribute(obj.id)}
              >
                <Text style={styles.addAttributeText}>+ Add Attribute</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity style={styles.addObjectButton} onPress={handleAddObject}>
          <Text style={styles.addObjectText}>+ Add Object</Text>
        </TouchableOpacity>

        {/* Modals */}
        <NameInputModal
          visible={inputVisible && (addingType === 'object' || addingType === 'attribute' || addingType === 'editAttribute' || addingType === 'editObject')}
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
        <TouchableOpacity style={styles.startSurveyButton} onPress={handleStartSurvey}>
          <Text style={styles.startSurveyText}>Start Survey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5f4',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 40,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6c5b5b',
    textAlign: 'center',
    marginBottom: 20,
  },
  objectContainer: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  objectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  objectTitleButton: {
    flex: 1,
  },
  objectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  deleteObjectButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteObjectText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attributeBox: {
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  attributeText: {
    fontSize: 16,
    color: '#333',
  },
  deleteAttributeButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAttributeText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  addAttributeButton: {
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  addAttributeText: {
    color: '#2e2e2e',
    fontWeight: '600',
  },
  addObjectButton: {
    backgroundColor: '#a7bce0',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 40,
  },
  addObjectText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  startSurveyButton: {
    backgroundColor: '#7a6161ff',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startSurveyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});