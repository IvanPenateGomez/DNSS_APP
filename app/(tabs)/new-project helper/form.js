import { useState } from 'react';
import { ObjectService } from './objects';
import { AttributeService } from './attributes';

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

  const addObject = (name, color) => {
    setObjects(prev => ObjectService.addObject(prev, name, color));
  };

  const updateObjectName = (objectId, newName) => {
    setObjects(prev => ObjectService.updateObjectName(prev, objectId, newName));
  };

  const deleteObject = (objectId) => {
    setObjects(prev => ObjectService.deleteObject(prev, objectId));
  };

  const addAttribute = (objectId, attributeName) => {
    setObjects(prev => AttributeService.addAttribute(prev, objectId, attributeName));
  };

  const updateAttribute = (objectId, attributeId, newName) => {
    setObjects(prev => AttributeService.updateAttribute(prev, objectId, attributeId, newName));
  };

  const deleteAttribute = (objectId, attributeId) => {
    setObjects(prev => AttributeService.deleteAttribute(prev, objectId, attributeId));
  };

  const findObject = (objectId) => {
    return ObjectService.findObject(objects, objectId);
  };

  const findAttribute = (objectId, attributeId) => {
    return ObjectService.findAttribute(objects, objectId, attributeId);
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
    setObjects,
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
  };
};