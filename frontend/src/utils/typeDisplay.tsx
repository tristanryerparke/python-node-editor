



export const mapStringToType = (input: string): string => {
  const typeMapping: { [key: string]: string } = {
    'str': 'Text',
    'number': 'Number',
  };

  return typeMapping[input] || 'Unknown';
};