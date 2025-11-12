const SPLIT_MAP: Record<string, [string, string]> = {
  'open wardrobe': ['Lay out socks + underwear', 'Add shirt + pants'],
  'put on outfit': ['Underwear + socks', 'Shirt + pants'],
  bathroom: ['Brush teeth', 'Face splash'],
  'pack essentials': ['Phone/wallet/keys on table', 'Add badge + water'],
  shoes: ['Shoes on', 'Grab bag & lock door'],
};

const DEFAULT_SPLIT: [string, string] = ['Prepare for 30s', 'Finish the remainder'];

export function getSplitPair(text: string): [string, string] {
  const lowered = text.toLowerCase();
  const match = Object.keys(SPLIT_MAP).find((key) => lowered.includes(key));
  return match ? SPLIT_MAP[match] : DEFAULT_SPLIT;
}
