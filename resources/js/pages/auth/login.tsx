
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { route } from 'ziggy-js';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const developmentCredentials = [
        {
            role: 'super_admin',
            email: 'superadmin@gmail.com',
        },
        {
            role: 'hr_admin',
            email: 'anessa.orales20@obx.gov.ph',
        },
        {
            role: 'ogm',
            email: 'usan.una28@obx.gov.ph',
        },
        {
            role: 'document_tracking_operator',
            email: 'anessa.orales20@obx.gov.ph',
            department: 'OBE',
        },
        {
            role: 'document_tracking_operator',
            email: 'onald.acapagal24@obx.gov.ph',
            department: 'OSD',
        },
        {
            role: 'document_tracking_operator',
            email: 'usan.una28@obx.gov.ph',
            department: 'GPAD',
        },
    ];

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                action={route('login.store')}
                method='post'
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={route('password.request')}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {/* {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <TextLink href={route('register')} tabIndex={5}>
                                    Sign up
                                </TextLink>
                            </div>
                        )} */}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Development credentials only</p>
                <p className="mt-1 text-amber-900">
                    These accounts are for development purposes only and must not
                    be exposed in production.
                </p>
                <p className='mt-5 text-red-400'>Password for all accounts: password</p>
                <div className="mt-4 space-y-3">
                    {developmentCredentials.map((credential, index) => (
                        <div
                            key={`${credential.role}-${credential.email}-${index}`}
                            className="rounded-md border border-amber-200 bg-white/70 p-3"
                        >
                            <p className="font-medium">Role: {credential.department ? `${credential.role} (${credential.department})` : credential.role}</p>
                            <p className='font-bold'>{credential.email}</p>
                        </div>
                    ))}
                </div>
            </div>
        </AuthLayout>
    );
}
