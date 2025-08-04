import React, { useState } from 'react';
import { UIControl, ErrorPanel } from '@rameses/ui';

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

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      console.log('Submitted Data: ', binding.getData());
      
      e.preventDefault();

      let validationResult = binding.validate();
      if (validationResult != null && validationResult !== '' ) {
         return;
      }

      try { 
         beforeSubmit?.(); 
      } 
      catch(err) {
         binding.setError( String(err)); 
         return; 
      }

      let actionResult: any = null; 

      if ( typeof action === 'function') { 
         try { 
            const res = await action( binding.getData()); 
            if ( res?.error?.message ) {
               throw Error( String( res.error.message )); 
            }
            else if ( res?.error ) {
               throw Error( String( res.error )); 
            }

            actionResult = res; 
         } 
         catch(err) {
            binding.setError( String(err)); 
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
            binding.setError( String(e.message)); 
            return; 
         } 
      }

      try { 
         afterSubmit?.( actionResult ); 
      } 
      catch(err) {
         binding.setError( String(err)); 
         return; 
      }
   };

   return (
      <form {...rest} onSubmit={handleSubmit}>
         <ErrorPanel binding={binding} />
         {children}
      </form>
   );
};

export default Form;
