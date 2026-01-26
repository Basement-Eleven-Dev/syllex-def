export type AppRoute = {
    routeName: string,
    subRoutes?: AppRoute[],
    integrations?: {
        method: 'POST' | 'PUT' | 'OPTIONS' | 'GET' | 'DELETE' | 'PATCH',
        functionPath: string
    }[]
}
export const FUNCTION_DECLARATIONS: AppRoute[] = [
    {
        routeName: 'profile',
        integrations: [{
            method: 'GET',
            functionPath: 'functions-refactoring/profile/getMyProfile.ts'
        }]
    }
];