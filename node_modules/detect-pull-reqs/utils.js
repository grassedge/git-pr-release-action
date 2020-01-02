exports.toChunk = (array, chunkSize) => {
  const tmp = Object.assign([], array);
  const chunked = [];
  while (tmp.length) {
    chunked.push(tmp.splice(0, chunkSize));
  }
  return chunked;
}
