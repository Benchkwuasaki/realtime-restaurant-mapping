<?php

use App\Http\Controllers\DocumentTrackingController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\BenefitsController;
use App\Http\Controllers\ReportsAndAnalyticsController;
use App\Http\Controllers\ActivityLogsController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\InternalOrganizationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\WhereaboutSlipController;
use App\Http\Controllers\EmploymentClassificationController;
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::group(['middleware' => ['auth', 'verified']], function () {
    // Dashboard Routes
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // User Routes
    Route::prefix('users')->name('user.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
    });

    // Employee Routes
    Route::prefix('employee')->name('employee.')->group(function () {
        Route::get('/', [EmployeeController::class, 'index'])->name('index');
        Route::get('/create', [EmployeeController::class, 'create'])->name('create');
        Route::post('/', [EmployeeController::class, 'store'])->name('store');
        Route::delete('/bulk-destroy', [EmployeeController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::get('/{employee}', [EmployeeController::class, 'show'])->name('show');
        Route::get('/{employee}/edit', [EmployeeController::class, 'edit'])->name('edit');
        Route::put('/{employee}', [EmployeeController::class, 'update'])->name('update');
        Route::patch('/{employee}/toggle', [EmployeeController::class, 'toggleStatus'])->name('toggleStatus');
        Route::delete('/{employee}', [EmployeeController::class, 'destroy'])->name('destroy');

        Route::prefix('employment-classifications')->name('employment-classification.')->group(function () {
            Route::post('/', [EmploymentClassificationController::class, 'store'])->name('store');
            Route::put('/{employmentClassification}', [EmploymentClassificationController::class, 'update'])->name('update');
            Route::delete('/{employmentClassification}', [EmploymentClassificationController::class, 'destroy'])->name('destroy');
        });

        // Government Accounts
        Route::post('/{employee}/government-account', [EmployeeController::class, 'storeGovernmentAccount'])->name('government-account.store');
        Route::put('/{employee}/government-account/{account}', [EmployeeController::class, 'updateGovernmentAccount'])->name('government-account.update');
        Route::delete('/{employee}/government-account/{account}', [EmployeeController::class, 'destroyGovernmentAccount'])->name('government-account.destroy');

        // Eligibility
        Route::post('/{employee}/eligibility', [EmployeeController::class, 'storeEligibility'])->name('eligibility.store');
        Route::put('/{employee}/eligibility/{eligibility}', [EmployeeController::class, 'updateEligibility'])->name('eligibility.update');
        Route::delete('/{employee}/eligibility/{eligibility}', [EmployeeController::class, 'destroyEligibility'])->name('eligibility.destroy');

        // Family
        Route::post('/{employee}/family', [EmployeeController::class, 'storeFamily'])->name('family.store');
        Route::put('/{employee}/family/{index}', [EmployeeController::class, 'updateFamily'])->name('family.update');
        Route::delete('/{employee}/family/{index}', [EmployeeController::class, 'destroyFamily'])->name('family.destroy');

        // Education
        Route::post('/{employee}/education', [EmployeeController::class, 'storeEducation'])->name('education.store');
        Route::put('/{employee}/education/{index}', [EmployeeController::class, 'updateEducation'])->name('education.update');
        Route::delete('/{employee}/education/{index}', [EmployeeController::class, 'destroyEducation'])->name('education.destroy');

        // Seminars & Trainings
        Route::post('/{employee}/seminar', [EmployeeController::class, 'storeSeminar'])->name('seminar.store');
        Route::put('/{employee}/seminar/{seminar}', [EmployeeController::class, 'updateSeminar'])->name('seminar.update');
        Route::delete('/{employee}/seminar/{seminar}', [EmployeeController::class, 'destroySeminar'])->name('seminar.destroy');

        // Service Records
        Route::post('/{employee}/service-record', [EmployeeController::class, 'storeServiceRecord'])->name('service-record.store');
        Route::put('/{employee}/service-record/{record}', [EmployeeController::class, 'updateServiceRecord'])->name('service-record.update');
        Route::delete('/{employee}/service-record/{record}', [EmployeeController::class, 'destroyServiceRecord'])->name('service-record.destroy');
    });

    // Organization Routes
    Route::prefix('organization/units')->name('unit.')->group(function () {
        Route::get('/', [UnitController::class, 'index'])->name('index');
        Route::post('/', [UnitController::class, 'store'])->name('store');
        Route::delete('/bulk-destroy', [UnitController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::get('/{unit}', [UnitController::class, 'show'])->name('show');
        Route::put('/{unit}', [UnitController::class, 'update'])->name('update');
        Route::delete('/{unit}', [UnitController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('organization/departments')->name('department.')->group(function () {
        Route::get('/', [DepartmentController::class, 'index'])->name('index');
        Route::get('/create', [DepartmentController::class, 'create'])->name('create');
        Route::post('/', [DepartmentController::class, 'store'])->name('store');
        Route::delete('/bulk-destroy', [DepartmentController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::get('/{department}', [DepartmentController::class, 'show'])->name('show');
        Route::get('/{department}/edit', [DepartmentController::class, 'edit'])->name('edit');
        Route::put('/{department}', [DepartmentController::class, 'update'])->name('update');
        Route::delete('/{department}', [DepartmentController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('organization/internal-organizations')->name('internal-organization.')->group(function () {
        Route::get('/', [InternalOrganizationController::class, 'index'])->name('index');
        Route::get('/create', [InternalOrganizationController::class, 'create'])->name('create');
        Route::post('/', [InternalOrganizationController::class, 'store'])->name('store');
        Route::delete('/bulk-destroy', [InternalOrganizationController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::get('/{internalOrganization}', [InternalOrganizationController::class, 'show'])->name('show');
        Route::get('/{internalOrganization}/edit', [InternalOrganizationController::class, 'edit'])->name('edit');
        Route::put('/{internalOrganization}', [InternalOrganizationController::class, 'update'])->name('update');
        Route::patch('/{internalOrganization}/toggle-status', [InternalOrganizationController::class, 'toggleStatus'])->name('toggle-status');
        Route::delete('/{internalOrganization}', [InternalOrganizationController::class, 'destroy'])->name('destroy');
        Route::post('/{internalOrganization}/members', [InternalOrganizationController::class, 'storeMembers'])->name('members.store');
    });
});

Route::prefix('organization/divisions')->name('division.')->group(function () {
    Route::get('/', [DivisionController::class, 'index'])->name('index');
    Route::post('/', [DivisionController::class, 'store'])->name('store');
    Route::delete('/bulk-destroy', [DivisionController::class, 'bulkDestroy'])->name('bulk-destroy');
    Route::get('/{division}', [DivisionController::class, 'show'])->name('show');
    Route::put('/{division}', [DivisionController::class, 'update'])->name('update');
    Route::delete('/{division}', [DivisionController::class, 'destroy'])->name('destroy');
});

Route::prefix('organization/positions')->name('position.')->group(function () {
    Route::get('/', [PositionController::class, 'index'])->name('index');
    Route::post('/', [PositionController::class, 'store'])->name('store');
    Route::delete('/bulk-destroy', [PositionController::class, 'bulkDestroy'])->name('bulk-destroy');
    Route::get('/{position}', [PositionController::class, 'show'])->name('show');
    Route::put('/{position}', [PositionController::class, 'update'])->name('update');
    Route::delete('/{position}', [PositionController::class, 'destroy'])->name('destroy');
});

Route::get('organization/position/{position}/employees', [PositionController::class, 'employees'])
    ->name('position.employees');

// Attendance Routes
Route::prefix('attendance/whereabout-slips')->name('whereabout-slip.')->group(function () {
    Route::get('/',                         [WhereaboutSlipController::class, 'index'])->name('index');
    Route::post('/',                        [WhereaboutSlipController::class, 'store'])->name('store');
    Route::put('/{whereaboutSlip}',         [WhereaboutSlipController::class, 'update'])->name('update');
    Route::put('/{whereaboutSlip}/return',  [WhereaboutSlipController::class, 'logReturn'])->name('log-return');
    Route::delete('/{whereaboutSlip}',      [WhereaboutSlipController::class, 'destroy'])->name('destroy');
    Route::delete('/',                      [WhereaboutSlipController::class, 'bulkDestroy'])->name('bulk-destroy');
});

Route::resource('holiday', HolidayController::class)->parameters([
    'holiday' => 'holiday:holiday_id',
]);

// Payroll routes
Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');

Route::get('/document_tracking', [DocumentTrackingController::class, 'index'])->name('document_tracking.index');

// Reports and Analytics routes
Route::get('/reports_and_analytics', [ReportsAndAnalyticsController::class, 'index'])->name('reports_and_analytics.index');

// Announcement Routes
Route::prefix('announcement')->name('announcement.')->group(function () {
    Route::get('/', [AnnouncementController::class, 'index'])->name('index');
});

// Activity Logs Routes

Route::get('/activity_logs', [ActivityLogsController::class, 'index'])->name('activity_logs.index');




require __DIR__ . '/settings.php';
