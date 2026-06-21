<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Spatie\Permission\Middleware\RoleMiddleware;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        channels: __DIR__.'/../routes/channels.php',
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);
    })

    ->withSchedule(function (Schedule $schedule): void {
        // Step 1: Ensure every active employee has at least an ABSENT record for today
        $schedule->command('attendance:sync-absent')
            ->dailyAt('00:01')
            ->timezone('Asia/Manila');

        // Step 2: Promote ABSENT → ON_LEAVE for any approved leave applications
        $schedule->command('attendance:sync-leave')
            ->dailyAt('00:05')
            ->timezone('Asia/Manila');
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            // $test = [
            //     $response->getStatusCode(),
            //     $exception->getMessage(),
            //     get_class($exception),
            // ];
            // dd($test);

            switch ($exception) {
                case $exception instanceof ValidationException:
                    return redirect()->back()->withErrors($exception->errors())->withInput();
                case $exception instanceof AuthenticationException:
                    return redirect()->route('login');
            }

            return Inertia::render('auth/error', [
                'status' => $response->getStatusCode(),
                'message' => $exception->getMessage(),
            ])
                ->toResponse($request)
                ->setStatusCode($response->getStatusCode());
        });

    })->create();
