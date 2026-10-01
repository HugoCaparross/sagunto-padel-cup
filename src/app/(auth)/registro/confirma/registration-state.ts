export type RegistrationState = {
    success: boolean;
    message: string;
    fieldErrors: Record<string, string[]>;
};

export const initialRegistrationState: RegistrationState = {
    success: false,
    message: "",
    fieldErrors: {},
};