<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
            'developmentCredentials' => $this->resolveDevelopmentCredentials(),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    private function resolveDevelopmentCredentials(): array
    {
        if (app()->isProduction()) {
            return [];
        }

        $rolePriority = [
            'super_admin' => 0,
            'hr_admin' => 1,
            'ogm' => 2,
            'document_tracking_operator' => 3,
            'employee' => 4,
        ];

        return User::query()
            ->with([
                'roles:id,name',
                'employee.item.position.department:department_id,department_acronym',
            ])
            ->whereHas('roles')
            ->get()
            ->map(function (User $user) use ($rolePriority) {
                $roles = $user->roles
                    ->pluck('name')
                    ->sortBy(fn (string $role) => $rolePriority[$role] ?? 99)
                    ->values()
                    ->all();

                return [
                    'email' => $user->email,
                    'roles' => $roles,
                    'department' => $user->employee?->item?->position?->department?->department_acronym,
                ];
            })
            ->unique(fn (array $credential) => implode('|', $credential['roles']) . '|' . ($credential['department'] ?? ''))
            ->sortBy([
                fn (array $credential) => $credential['roles'][0] === 'super_admin' ? 0 : 1,
                fn (array $credential) => count($credential['roles']),
                fn (array $credential) => implode('|', $credential['roles']),
                fn (array $credential) => $credential['department'] ?? 'ZZZ',
            ])
            ->values()
            ->all();
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
