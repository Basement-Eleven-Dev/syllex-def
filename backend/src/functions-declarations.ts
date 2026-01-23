export type AppRoute = {
    routeName: string,
    subRoutes?: AppRoute[],
    integration?: {
        method: 'POST' | 'PUT' | 'OPTIONS' | 'GET' | 'DELETE' | 'PATCH',
        functionPath: string
    }
}
export const FUNCTION_DECLARATIONS: AppRoute[] = [
    {
        routeName: 'profile',
        integration: {
            method: 'GET',
            functionPath: 'functions/profile/getMyProfile.ts'
        }
    }
];