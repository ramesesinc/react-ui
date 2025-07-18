import axios from "axios";

export const isAxiosError = ( err: any ) => {
    if ( !err ) return false; 
    return axios.isAxiosError( err );  
};

export const getAxiosError = ( err: any ) => {
    const status = err.response?.status || 500;

    let message = null; 

    if ( err.response && err.response?.data ) {
        if (typeof err.response.data === "string") {
            message = err.response.data;
        } else if (typeof err.response.data === "object" && err.response.data.message) {
            message = err.response.data.message;
        } else if (typeof err.response.data === "object" && err.response.data.msg) {
            message = err.response.data.msg;
        } else if ( err.response.data ) {
            message = String(err.response.data);
        }
    }
    else if ( err.message ) {
        message = err.message; 
    }
    else if ( err.errors && Array.isArray(err.errors) && err.errors.length > 0 ) {
        const lastErr = err.errors[ err.errors.length - 1 ]; 
        message = String(lastErr); 
    }
    else if ( err.code ) {
        message = String(err.code); 
    }

    return { status, message, cause: err }
}; 

export const getError = ( err: any ) => {
    if ( isAxiosError(err)) { 
        return getAxiosError( err ); 
    }
    else if ( err instanceof Error ) {
        return { message: err.message, cause: err };
    }
    return { message: String(err) };
};

const errorUtil = {
    isAxiosError, getAxiosError, getError 
}

export default errorUtil;
