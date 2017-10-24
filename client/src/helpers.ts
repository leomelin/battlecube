export const minLen = (minLength: number) => (v: string) => v && v.length > minLength;
const urlRegex = /^(http|https):\/\//;
export const hasProtocalInUrl = (value: string) => urlRegex.test(value);
const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
export const isHex = (value: string) => hexRegex.test(value);

export const pick = (names: string[], obj: any) => {
  const result: any = {};
  let idx = 0;
  while (idx < names.length) {
    if (names[idx] in obj) {
      result[names[idx]] = obj[names[idx]];
    }
    idx += 1;
  }
  return result;
};
