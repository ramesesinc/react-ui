import React, { useState } from 'react';
import { BindingModel, UIControl } from '@rameses/client';

import axios from 'axios';
import errorUtil from '../common/ErrorUtil';

interface FormProps extends UIControl {
   action?: string | ((data: Record<string, any>) => Promise<any>);

   onSubmit?: never;

   beforeSubmit?: () => void;
   afterSubmit?: ( result: any ) => void;

   children: React.ReactNode;
}

const Form: React.FC<FormProps> = ({
   binding,
   action,
   onSubmit,
   beforeSubmit,
   afterSubmit,
   children,
   ...rest
}) => {
   const [error, setError] = useState<string | null>(null); 

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      console.log('Submitted Data: ', binding.getData());
      
      e.preventDefault();

      let result = binding.validate();
      if ((result ?? '') === '') {
         setError( null ); 
      }
      else {
         setError( result!.toString()); 
         return; 
      }

      try { 
         beforeSubmit?.(); 
      } 
      catch(err) {
         setError( String(err)); 
         return; 
      }

      let actionResult: any = null; 

      if ( typeof action === 'function') { 
         try { 
            const res = await action( binding.getData()); 
            if ( res?.error?.message ) {
               setError( String( res.error.message )); 
               return; 
            }
            else if ( res?.error ) {
               setError( String( res.error )); 
               return; 
            }

            actionResult = res; 
         } 
         catch(err) {
            setError( String(err)); 
            return; 
         }
      }
      else if ( typeof action === 'string') {
         try {
            const res = await axios.post( action, binding.getData());
            const { data } = res; 
            actionResult = data; 
         } 
         catch (err: any) {
            const e: any = errorUtil.getError( err ); 
            setError( String(e.message)); 
            return; 
         } 
      }

      try { 
         afterSubmit?.( actionResult ); 
      } 
      catch(err) {
         setError( String(err)); 
         return; 
      }
   };

   return (
      <form {...rest} onSubmit={handleSubmit}>
         {error && (
            <label className="block w-full bg-red-100 text-red-700 ring-1 ring-red-300 rounded px-4 py-4 mb-4 text-sm font-medium">
               {error}
            </label>
         )}
         {children}
      </form>
   );
};

export default Form;
