import { Button } from '@mantine/core';
import useExecuteFlow from '../hooks/useExecuteFlow';

export default function ExecuteMenu() {
  const { execute, loading } = useExecuteFlow();

  return <div className='w-full'>
    <Button 
      variant='outline'
      w='100%'
      onClick={execute}
      loading={loading}
    >
      Execute
    </Button>
  </div>
}