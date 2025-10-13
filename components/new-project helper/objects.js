export class FormObject {
  constructor(id, name, color, attributes = []) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.attributes = attributes;
  }

  static create(name, color) {
    return new FormObject(Date.now(), name, color, []);
  }
}

export const ObjectService = {
  addObject: (objects, name, color) => {
    return [...objects, FormObject.create(name, color)];
  },

  updateObjectName: (objects, objectId, newName) => {
    return objects.map(obj =>
      obj.id === objectId ? { ...obj, name: newName } : obj
    );
  },

  deleteObject: (objects, objectId) => {
    return objects.filter(obj => obj.id !== objectId);
  },

  findObject: (objects, objectId) => {
    return objects.find(obj => obj.id === objectId);
  },

  findAttribute: (objects, objectId, attributeId) => {
    const object = objects.find(obj => obj.id === objectId);
    return object?.attributes.find(attr => attr.id === attributeId);
  }
};