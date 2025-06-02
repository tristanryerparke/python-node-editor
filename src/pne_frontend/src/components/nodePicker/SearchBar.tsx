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
        classNames={{
          wrapper: 'h-7',
          input: 'h-7 min-h-7 text-lg',
        }}
        color='dark'
        leftSection={<IconSearch size={16} color='black'/>}
        value={searchTerm}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
      />
      <ActionIcon 
        onClick={onRefresh} 
        variant='outline'
        classNames={{
          root: 'h-7 w-8',
        }}
      >
        <IconReload size={16} color='black' />
      </ActionIcon>
    </div>
  );
} 