import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { ObjectService } from './objects';
import { AttributeService } from './attributes';
import { isValidColor } from './colors';

export const useFormState = () => {
  const [objects, setObjects] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [hexInputVisible, setHexInputVisible] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [colorValue, setColorValue] = useState('');
  const [addingType, setAddingType] = useState('object');
  const [tempObjectName, setTempObjectName] = useState('');
  const [editingAttributeId, setEditingAttributeId] = useState(null);

  // Object Actions
  const addObject = (name, color) => {
    setObjects(prev => ObjectService.addObject(prev, name, color));
  };

  const updateObjectName = (objectId, newName) => {
    setObjects(prev => ObjectService.updateObjectName(prev, objectId, newName));
  };

  const deleteObject = (objectId) => {
    setObjects(prev => ObjectService.deleteObject(prev, objectId));
  };

  // Attribute Actions
  const addAttribute = (objectId, attributeName) => {
    setObjects(prev => AttributeService.addAttribute(prev, objectId, attributeName));
  };

  const updateAttribute = (objectId, attributeId, newName) => {
    setObjects(prev => AttributeService.updateAttribute(prev, objectId, attributeId, newName));
  };

  const deleteAttribute = (objectId, attributeId) => {
    setObjects(prev => AttributeService.deleteAttribute(prev, objectId, attributeId));
  };

  // Finders
  const findObject = (objectId) => {
    return ObjectService.findObject(objects, objectId);
  };

  const findAttribute = (objectId, attributeId) => {
    return ObjectService.findAttribute(objects, objectId, attributeId);
  };

  // Event Handlers
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

  return {
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
    resetHexModal
  };
};