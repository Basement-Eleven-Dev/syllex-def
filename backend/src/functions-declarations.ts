export type AppRole = 'student' | 'teacher' | 'logged' | 'open';

/**
 * functionPath is the relative path from FUNCTIONS_PATH (in environments.ts)
 */
export type FunctionIntegration = {
    apiRoute: string,
    functionPath: string,
    method: 'POST' | 'PUT' | 'OPTIONS' | 'GET' | 'DELETE' | 'PATCH',
    role: AppRole
}

export const FUNCTION_INTEGRATIONS: FunctionIntegration[] = [
    {
        apiRoute: 'profile',
        functionPath: 'profile/getMyProfile.ts',
        method: 'GET',
        role: 'logged'
    },
    {
        apiRoute: 'status',
        functionPath: 'status.ts',
        method: 'GET',
        role: 'open'
    },
]