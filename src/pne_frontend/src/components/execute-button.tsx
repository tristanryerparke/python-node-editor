import { Button } from "@/components/ui/button";
import useExecuteFlow from '../hooks/useExecuteFlow';
import { LoaderIcon } from "lucide-react";

export default function ExecuteMenu() {
  const { execute, loading } = useExecuteFlow();

  return <div className='w-full'>
    <Button
      className='w-full'
      onClick={execute}
      disabled={loading}
    >
      {loading ? (
        <LoaderIcon className="animate-spin" />
      ) : (
        "Execute"
      )}
    </Button>
  </div>
}