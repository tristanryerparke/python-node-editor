import { Button } from "@/components/ui/button";
import useExecuteFlow from '../hooks/useExecuteFlow';

export default function ExecuteMenu() {
  const { execute, loading } = useExecuteFlow();

  return <div className='w-full'>
    <Button
      className='w-full'
      onClick={execute}
      disabled={loading}
    >
      {loading ? (
        <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full align-[-0.125em]"></span>
      ) : null}
      Execute
    </Button>
  </div>
}