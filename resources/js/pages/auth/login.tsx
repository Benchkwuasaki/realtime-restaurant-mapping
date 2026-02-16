import { Form, Head } from '@inertiajs/react';
import { LoginForm } from "@/components/login-form"

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({

}: Props) {
    return (
        <>
            <Head title="Log in" />
            <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm md:max-w-4xl">
                    <LoginForm />
                </div>
            </div>
        </>
    );
}
