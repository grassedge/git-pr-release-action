const { toChunk } = require('../utils');

test('toChunk', async() => {
  const array = [1,2,3,4,5,6,7,8,9];
  {
    const chunked = toChunk(array, 2);
    await expect(array).toEqual([1,2,3,4,5,6,7,8,9]);
    await expect(chunked).toEqual([[1,2],[3,4,],[5,6],[7,8],[9]]);
  }
  {
    const chunked = toChunk(array, 5);
    await expect(array).toEqual([1,2,3,4,5,6,7,8,9]);
    await expect(chunked).toEqual([[1,2,3,4,5],[6,7,8,9]]);
  }
});
