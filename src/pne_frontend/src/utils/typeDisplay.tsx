



export const mapStringToType = (input: string): string => {
  const typeMapping: { [key: string]: string } = {
    'string': 'Text',
    'number': 'Number',
  };

  return typeMapping[input] || 'Unknown';
};