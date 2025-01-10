
import { Button } from '@mantine/core';
import useExecuteFlow from '../hooks/useExecuteFlow';

export default function ExecuteMenu() {
  const { execute } = useExecuteFlow();

  return <div style={{padding: '0.25rem'}}>
    <Button 
      variant='outline'
      w='100%'
      onClick={execute}
    >
      Execute
    </Button>
  </div>
}