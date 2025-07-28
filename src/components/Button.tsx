import React, { ReactNode, useState } from "react";
import { UIButtonControl } from '@rameses/ui';

type ButtonType = "button" | "submit"

interface ButtonProps extends UIButtonControl {
   type?: ButtonType;
   disabled?: boolean;
   children?: ReactNode;
}

export default function Button( props: ButtonProps ) {

   const {
      binding,
      dynamic,
      name,
      type = "button",
      className = "",
      disabled = false,
      onClick = (event: React.MouseEvent<HTMLButtonElement>) => {},
      children

   } = props;

   const [loading, setLoading] = useState(false);

   const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      try {
         setLoading(true);
         const resp: any = onClick?.(event);
         if ( resp && resp instanceof Promise ) {
            await resp; 
         }
      } 
      finally {
         setLoading(false);
      }
   };

   return (
      <button
         name={name}
         type={type}
         onClick={handleClick}
         disabled={disabled || loading}

         className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
        bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed ${className}`.trim()}
      >
         {loading && (
            <svg
               className="animate-spin h-4 w-4 text-white"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
            >
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
         )}
         {children}
      </button>
   );
}
