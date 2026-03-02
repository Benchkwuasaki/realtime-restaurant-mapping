import { Button } from "@/components/ui/button";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { route } from "ziggy-js";

type ErrorProps = {
    status: number;
    message: string;
}

export default function Error({ status, message }: ErrorProps) {
    return (
        <>
            <Head title="Error" />
            <div>
                <div className="min-h-screen flex items-center justify-center px-6 bg-background">
                    <div className="text-center max-w-md w-full">
                        <h1 className="text-6xl font-extrabold tracking-tight text-destructive">
                            Error {status}
                        </h1>

                        <p className="mt-4 text-lg font-medium text-foreground">
                            Something went wrong
                        </p>

                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {message}
                        </p>

                        <div className="mt-8">
                            <Link href={route('home')}>
                                <Button className="w-full sm:w-auto px-8" size={"lg"}>
                                    <ArrowLeft />
                                    Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
