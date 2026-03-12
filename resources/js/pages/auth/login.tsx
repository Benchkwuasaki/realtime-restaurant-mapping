import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
                method="post"
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
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Development credentials only</CardTitle>
                    <CardDescription className='text-red-400'>
                        These accounts are for development purposes only and must not be exposed in production.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="rounded-md border px-3 py-2 text-sm">
                        Password for all accounts: <span className="font-semibold">password</span>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                            <span>Role</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                            <span>Department</span>
                        </div>
                    </div>
                    {/* Credentials */}
                    <div className="grid gap-3">
                        {developmentCredentials.map((credential, index) => (
                            <Card
                                className="py-0"
                                key={`${credential.role}-${credential.email}-${index}`}
                            >
                                <CardContent className="flex flex-col gap-2 p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="default">
                                            {credential.role}
                                        </Badge>

                                        {credential.department && (
                                            <Badge variant="secondary">
                                                {credential.department}
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-sm font-medium break-all">
                                        {credential.email}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}