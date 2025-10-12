import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, Platform } from 'react-native';

export default function ExploreScreen() {
  const [objects, setObjects] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [addingType, setAddingType] = useState('object'); // 'object' or 'attribute'

  // Add object (cross-platform)
  const handleAddObject = () => {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('New Object', 'Enter the name of the object:', (name) => {
        if (!name) return;
        setObjects([...objects, { id: Date.now(), name, attributes: [] }]);
      });
    } else {
      setAddingType('object');
      setInputVisible(true);
    }
  };

  // Add attribute (cross-platform)
  const handleAddAttribute = (objectId) => {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('New Attribute', 'Enter the name of the attribute:', (name) => {
        if (!name) return;
        setObjects((prev) =>
          prev.map((obj) =>
            obj.id === objectId
              ? { ...obj, attributes: [...obj.attributes, { id: Date.now(), name }] }
              : obj
          )
        );
      });
    } else {
      setAddingType('attribute');
      setCurrentObjectId(objectId);
      setInputVisible(true);
    }
  };

  // Confirm text input (for Android)
  const confirmInput = () => {
    if (!inputValue.trim()) return;
    if (addingType === 'object') {
      setObjects([...objects, { id: Date.now(), name: inputValue, attributes: [] }]);
    } else if (addingType === 'attribute') {
      setObjects((prev) =>
        prev.map((obj) =>
          obj.id === currentObjectId
            ? { ...obj, attributes: [...obj.attributes, { id: Date.now(), name: inputValue }] }
            : obj
        )
      );
    }
    setInputValue('');
    setInputVisible(false);
    setCurrentObjectId(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Form Creation</Text>

      {objects.map((obj) => (
        <View key={obj.id} style={styles.objectContainer}>
          <Text style={styles.objectTitle}>{obj.name}</Text>

          {obj.attributes.map((attr) => (
            <View key={attr.id} style={styles.attributeBox}>
              <Text style={styles.attributeText}>{attr.name}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addAttributeButton}
            onPress={() => handleAddAttribute(obj.id)}
          >
            <Text style={styles.addAttributeText}>+ Add Attribute</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addObjectButton} onPress={handleAddObject}>
        <Text style={styles.addObjectText}>+ Add Object</Text>
      </TouchableOpacity>

      {inputVisible && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={`Enter ${addingType} name`}
            value={inputValue}
            onChangeText={setInputValue}
          />
          <TouchableOpacity style={styles.confirmButton} onPress={confirmInput}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5f4',
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
    backgroundColor: '#c9e6d1',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  objectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3e3e3e',
    textAlign: 'center',
    marginBottom: 10,
  },
  attributeBox: {
    backgroundColor: '#e0f0e5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  attributeText: {
    fontSize: 16,
    color: '#333',
  },
  addAttributeButton: {
    backgroundColor: '#a8d5b9',
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
});