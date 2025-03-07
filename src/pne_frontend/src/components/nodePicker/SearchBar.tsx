import { ActionIcon, TextInput } from '@mantine/core';
import { IconReload, IconSearch } from '@tabler/icons-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function SearchBar({ searchTerm, onSearchChange, onRefresh }: SearchBarProps) {
  return (
    <div className='pne-div' style={{
      flexDirection: 'row', 
    //   justifyContent: 'flex-end', 
      alignItems: 'center',
      gap: '0.25rem',
      height: 'auto',
      padding: '0.25rem',
    }}>
      <TextInput
        w='100%'
        leftSection={<IconSearch size={16} color='black'/>}
        size='xs'
        value={searchTerm}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
      />
      <ActionIcon 
        h={29.5} 
        w={29.5} 
        onClick={onRefresh} 
        variant='subtle' 
      >
        <IconReload size={16} />
      </ActionIcon>
    </div>
  );
} 