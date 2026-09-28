// layout.js：下一个偏移、填充字节与总大小
export function nextAt(fields, width) {
  const end = fields.length ? fields[fields.length - 1][2] + fields[fields.length - 1][1] : 0;
  return Math.ceil(end / width) * width;
}

export function padOf(fields, name) {
  const index = fields.findIndex(function (row) { return row[0] === name; });
  if (index < 0) return -1;
  if (index === 0) return fields[0][2];
  const prev = fields[index - 1];
  return fields[index][2] - (prev[2] + prev[1]);
}

export function totalOf(fields) {
  if (!fields.length) return 0;
  const maxWidth = fields.reduce(function (m, row) { return Math.max(m, row[1]); }, 0);
  const end = fields[fields.length - 1][2] + fields[fields.length - 1][1];
  return Math.ceil(end / maxWidth) * maxWidth;
}
