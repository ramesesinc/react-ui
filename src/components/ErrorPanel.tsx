import React, { useEffect, useState } from 'react';
import { UIControl } from '@rameses/ui';

interface ErrorPanelProps extends UIControl {}

const ErrorPanel: React.FC<ErrorPanelProps> = ({
   binding,
   ...rest
}) => {

   const [ error, setError ] = useState<string | null>(null); 

   useEffect(() => { 
      setError( binding.error ); 
   }, [binding.error]); 

   return (
      <>
         {error && (
            <label className="block w-full bg-red-100 text-red-700 ring-1 ring-red-300 rounded px-4 py-4 mb-4 text-sm font-medium">
               {error}
            </label>
         )}
      </>
   );
};

export default ErrorPanel;
