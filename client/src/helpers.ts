export const minLen = (minLength: number) => (v: string) => v && v.length > minLength;
const urlRegex = /^(http|https):\/\//;
export const hasProtocalInUrl = (value: string) => urlRegex.test(value);
const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
export const isHex = (value: string) => hexRegex.test(value);
