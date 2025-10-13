export class Attribute {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  static create(name) {
    return new Attribute(Date.now(), name);
  }
}

export const AttributeService = {
  addAttribute: (objects, objectId, attributeName) => {
    return objects.map(obj =>
      obj.id === objectId
        ? { ...obj, attributes: [...obj.attributes, Attribute.create(attributeName)] }
        : obj
    );
  },

  updateAttribute: (objects, objectId, attributeId, newName) => {
    return objects.map(obj =>
      obj.id === objectId
        ? {
            ...obj,
            attributes: obj.attributes.map(attr =>
              attr.id === attributeId ? { ...attr, name: newName } : attr
            )
          }
        : obj
    );
  },

  deleteAttribute: (objects, objectId, attributeId) => {
    return objects.map(obj =>
      obj.id === objectId
        ? { ...obj, attributes: obj.attributes.filter(attr => attr.id !== attributeId) }
        : obj
    );
  }
};