import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { basicColors } from './colors';

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 5,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  hexInputButton: {
    backgroundColor: '#7a6161ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  hexInputButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'center',
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  colorText: {
    fontSize: 14,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#7a6161ff',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export const NameInputModal = ({
  visible,
  addingType,
  inputValue,
  onInputChange,
  onCancel,
  onConfirm,
  onConfirmObjectName
}) => {
  const getModalTitle = () => {
    switch (addingType) {
      case 'object': return 'New Object';
      case 'attribute': return 'New Attribute';
      case 'editAttribute': return 'Edit Attribute';
      case 'editObject': return 'Edit Object Name';
      default: return '';
    }
  };

  const getConfirmButtonText = () => {
    switch (addingType) {
      case 'object': return 'Next';
      case 'attribute': return 'Add';
      case 'editAttribute': return 'Save';
      case 'editObject': return 'Save';
      default: return 'Confirm';
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{getModalTitle()}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Enter ${addingType.includes('object') ? 'object' : 'attribute'} name`}
            value={inputValue}
            onChangeText={onInputChange}
            autoFocus={true}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={addingType === 'object' ? onConfirmObjectName : onConfirm}
            >
              <Text style={styles.confirmButtonText}>{getConfirmButtonText()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const ColorPickerModal = ({
  visible,
  tempObjectName,
  onSelectColor,
  onOpenHexInput,
  onCancel
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose a Color</Text>
          <Text style={styles.modalSubtitle}>For: {tempObjectName}</Text>
          
          <View style={styles.colorGrid}>
            {basicColors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.colorOption, { backgroundColor: color }]}
                onPress={() => onSelectColor(color)}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={styles.hexInputButton}
            onPress={onOpenHexInput}
          >
            <Text style={styles.hexInputButtonText}>Custom Hex Color</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]} 
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const HexInputModal = ({
  visible,
  tempObjectName,
  colorValue,
  onColorChange,
  isValidColor,
  getValidColor,
  onBack,
  onConfirm
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Custom Color</Text>
          <Text style={styles.modalSubtitle}>For: {tempObjectName}</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Enter hex color (e.g., #FF5733)"
            value={colorValue}
            onChangeText={onColorChange}
            autoFocus={true}
            autoCapitalize="characters"
          />
          
          <View style={styles.colorPreview}>
            <View 
              style={[
                styles.colorBox, 
                { backgroundColor: getValidColor(colorValue) }
              ]} 
            />
            <Text style={styles.colorText}>
              {isValidColor(getValidColor(colorValue)) ? getValidColor(colorValue).toUpperCase() : 'Enter valid hex color'}
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onBack}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.confirmButton,
                !isValidColor(getValidColor(colorValue)) && styles.disabledButton
              ]} 
              onPress={onConfirm}
              disabled={!isValidColor(getValidColor(colorValue))}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};