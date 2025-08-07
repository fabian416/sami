export const DECIMALS = 1e6;

export const COLORS = [
  "!text-pink-400",
  "!text-red-500",
  "!text-green-400",
  "!text-blue-400",
  "!text-orange-400",
  "!text-yellow-400",
  "!text-cyan-400",
];

export const AVATARS = [
  "/avatar/1.jpg",
  "/avatar/2.jpg",
  "/avatar/3.jpg",
  "/avatar/4.jpg",
  "/avatar/5.jpg",
  "/avatar/6.jpg",
];

const getPermutations = (str: string) => {
  if (str.length <= 1) return [str];
  const permutations: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remainingChars = str.slice(0, i) + str.slice(i + 1);
    for (const perm of getPermutations(remainingChars)) {
      permutations.push(char + perm);
    }
  }
  return permutations;
};

export const NAMES = getPermutations("SAMI").filter(name => name !== "SAMI");
