import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },valueSection: {
    marginTop: 6,
    marginLeft: 14,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffffffdd",
    borderWidth: 0.6,
    borderColor: "#e0d6d6",
  },
  valueHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7a6161ff",
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  valueBullet: {
    color: "#7a6161ff",
    fontSize: 12,
    marginRight: 4,
    lineHeight: 16,
  },
  valueText: {
    fontSize: 12,
    color: "#544141ff",
    flexShrink: 1,
    lineHeight: 16,
  },
  valueType: {
    fontStyle: "italic",
    fontWeight: "500",
  },
  valueTypeText: { color: "#6c5f5f" },
  valueTypeNumber: { color: "#2E6EF0" },
  valueTypeBool: { color: "#007a5a" },
  valueTypeDate: { color: "#a05c00" },
  valueTypeImage: { color: "#b89a9aff" },
  valueTypeSelect: { color: "#7a6161ff" },
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