var common = require('./common.js');

exports.preTransform = function (model) {
  if (model.harp) {
    var kind = getKind(model.harp);
    model.title = getValue(model.name) + (kindLabels[kind] ? ' ' + kindLabels[kind] : '');
    model.tableReference = getTableReference(model, kind);
    model.children = [];
  }
  return model;
}

var kindLabels = {
  register: 'register',
  payload: 'payload',
  bitMask: 'bit mask',
  groupMask: 'group mask'
};

function getTableReference(model, kind) {
  var harp = model.harp;
  var members = getChildren(model).filter(function (child) { return getParentUid(child) === model.uid; });
  var tables = [];
  var anchors = {};
  if (kind === 'register') {
    tables = getPayloadTables(harp.register, anchors);
  } else if (kind === 'payload') {
    tables.push(getTable('members', 'Members', 2, members, getMemberColumns(anchors), ''));
  } else if (kind === 'bitMask' || kind === 'groupMask') {
    tables.push(getTable('values', 'Values', 2, members, valueColumns, ''));
  }

  return {
    aliases: members.filter(function (child) { return !child.harp; }).map(function (child) {
      return { id: common.getHtmlId(child.uid), uid: child.uid };
    }),
    details: getDetails(harp, anchors),
    tables: tables.filter(function (table) { return table; }),
    conceptualHeading: 'Examples'
  };
}

function getPayloadTables(register, anchors) {
  var tables = [];
  var payloadId = 'payload';
  var masks = register.masks || [];
  if (register.members) {
    masks.forEach(function (mask) {
      anchors[mask.uid] = common.getHtmlId(mask.uid) + '_values';
    });
    tables.push(getTable(payloadId, 'Payload', 2, register.members.map(getMemberItem), getMemberColumns(anchors),
      'The payload is a structure with the following members.'));
    masks.forEach(function (mask) {
      var users = register.members.filter(function (member) {
        return member.interfaceType && member.interfaceType.uid === mask.uid;
      });
      tables.push(getTable(anchors[mask.uid], mask.name + ' ' + kindLabels[mask.kind], 3,
        mask.values.map(getValueItem), valueColumns, getMaskIntro(mask, users)));
    });
  } else if (masks.length > 0) {
    tables.push(getTable(payloadId, 'Payload', 2, masks[0].values.map(getValueItem), valueColumns, getMaskIntro(masks[0], [])));
  }
  if (tables.length > 0 && register.interfaceType && register.interfaceType.uid) {
    anchors[register.interfaceType.uid] = payloadId;
  }
  return tables;
}

function getMaskIntro(mask, users) {
  var subject = 'The payload is';
  if (users.length > 0) {
    var names = users.map(function (member) { return '<code>' + escapeHtml(member.name) + '</code>'; });
    var list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
    subject = 'The ' + list + (names.length > 1 ? ' members are each' : ' member is');
  }
  return subject + (mask.kind === 'bitMask' ? ' a combination of the following flags.' : ' one of the following values.');
}

function getDetails(harp, anchors) {
  var details = [];
  var register = harp.register;
  if (register) {
    details.push(getDetail('Address', register.address));
    details.push(getDetail('Payload type', register.payloadType));
    details.push(getDetail('Access', (register.access || []).join(', ')));
    details.push(getDetail('Length', register.length));
    details.push(getDetail('Default', register.defaultValue));
    details.push(getDetail('Minimum', register.minValue));
    details.push(getDetail('Maximum', register.maxValue));
    details.push(getDetail('Interface type', getTypeLink(register.interfaceType, anchors), true));
  }
  if (harp.payload) {
    var links = (harp.payload.registers || []).map(function (type) { return getTypeLink(type); });
    details.push(getDetail('Registers', links.join(', '), true));
  }
  var mask = harp.bitMask || harp.groupMask;
  if (mask) {
    details.push(getDetail('Type', mask.type));
  }
  return details.filter(function (detail) { return detail.description; });
}

function getDetail(term, value, isHtml) {
  return { term: term, description: isHtml ? value : formatText(value) };
}

var nameColumn = {
  header: 'Name',
  cell: function (item) { return '<code>' + escapeHtml(getValue(item.name)) + '</code>'; }
};

var descriptionColumn = {
  header: 'Description',
  cell: function (item) { return (item.summary || '') + (item.conceptual || ''); }
};

function getMemberColumns(anchors) {
  return [
    nameColumn,
    { header: 'Offset', cell: function (item) { return formatText(getMember(item).offset); } },
    { header: 'Length', cell: function (item) { return formatText(getMember(item).length); } },
    { header: 'Mask', cell: function (item) { return formatText(getMember(item).mask); } },
    { header: 'Type', cell: function (item) { return getTypeLink(getMember(item).interfaceType, anchors); } },
    { header: 'Default&nbsp;[range]', cell: function (item) { return escapeHtml(formatDefaultRange(getMember(item))); } },
    descriptionColumn
  ];
}

var valueColumns = [
  nameColumn,
  { header: 'Value', cell: function (item) { return formatText((item.harp && item.harp.maskValue || {}).value); } },
  descriptionColumn
];

function getTable(id, heading, level, items, columns, intro) {
  if (items.length === 0) return null;
  var cells = items.map(function (item) {
    return columns.map(function (column) { return column.cell(item) || ''; });
  });
  var used = columns.map(function (column, index) {
    return cells.some(function (row) { return row[index] !== ''; });
  });
  return {
    id: id,
    heading: heading,
    level: level,
    intro: intro,
    columns: columns.filter(function (column, index) { return used[index]; }).map(function (column) {
      return { header: column.header };
    }),
    rows: items.map(function (item, row) {
      return {
        id: item.uid ? common.getHtmlId(item.uid) : '',
        uid: item.uid || '',
        cells: cells[row].filter(function (cell, index) { return used[index]; }).map(function (cell) {
          return { html: cell };
        })
      };
    })
  };
}

function getChildren(model) {
  var children = model.children || [];
  if (children[0] && children[0].lang && children[0].value) {
    return children[0].value;
  }
  return children;
}

function getParentUid(item) {
  var parent = item.parent;
  if (Array.isArray(parent)) {
    parent = parent.length > 0 ? parent[0].value : null;
  }
  if (parent && typeof parent === 'object') {
    parent = parent.uid;
  }
  return parent || '';
}

function getKind(harp) {
  if (!harp) return undefined;
  return Object.keys(kindLabels).filter(function (key) { return harp[key]; })[0];
}

function getMemberItem(member) {
  return {
    name: member.name,
    summary: formatText(member.summary),
    harp: { member: member }
  };
}

function getValueItem(value) {
  return {
    name: value.name,
    summary: formatText(value.summary),
    harp: { maskValue: value }
  };
}

function getMember(item) {
  return item.harp && item.harp.member || {};
}

function getTypeLink(type, anchors) {
  if (!type) return '';
  if (!type.uid) return escapeHtml(type.name);
  if (anchors && anchors[type.uid]) {
    return '<a href="#' + escapeHtml(anchors[type.uid]) + '">' + escapeHtml(type.name) + '</a>';
  }
  return '<xref uid="' + escapeHtml(type.uid) + '" text="' + escapeHtml(type.name) + '"/>';
}

function formatDefaultRange(value) {
  var parts = [];
  if (hasValue(value.defaultValue)) {
    parts.push(String(value.defaultValue));
  }
  if (hasValue(value.minValue) || hasValue(value.maxValue)) {
    parts.push('[' + (hasValue(value.minValue) ? value.minValue : '') + ':' + (hasValue(value.maxValue) ? value.maxValue : '') + ']');
  }
  return parts.join(' ');
}

function getValue(values) {
  if (!Array.isArray(values)) return values || '';
  return values.length > 0 ? values[0].value : '';
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function formatText(value) {
  return hasValue(value) ? escapeHtml(String(value)) : '';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
