import { ActionIcon, TextInput } from '@mantine/core';
import { IconReload, IconSearch } from '@tabler/icons-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function SearchBar({ searchTerm, onSearchChange, onRefresh }: SearchBarProps) {
  return (
    <div className='flex flex-row items-center px-1 py-1 gap-1'>
      <TextInput
        w='100%'
        color='dark'
        leftSection={<IconSearch size={16} color='black'/>}
        size='xs'
        value={searchTerm}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
      />
      <ActionIcon 
        h={29.5} 
        w={29.5} 
        onClick={onRefresh} 
        variant='outline' 
      >
        <IconReload size={16} />
      </ActionIcon>
    </div>
  );
} 