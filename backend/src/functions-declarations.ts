/**
 * functionPath is the relative path from FUNCTIONS_PATH (in environments.ts)
 */
export type FunctionIntegration = {
    apiRoute: string,
    functionPath: string,
    method: 'POST' | 'PUT' | 'OPTIONS' | 'GET' | 'DELETE' | 'PATCH'
}

export const FUNCTION_INTEGRATIONS: FunctionIntegration[] = [
    {
        apiRoute: 'profile',
        functionPath: 'profile/getMyProfile.ts',
        method: 'GET'
    }
]