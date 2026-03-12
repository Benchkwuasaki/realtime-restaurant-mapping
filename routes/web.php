<?php

use App\Http\Controllers\ActivityLogsController;
use App\Http\Controllers\AllowanceManagementController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceLogController;
use App\Http\Controllers\AttendanceRecordController;
use App\Http\Controllers\AttendanceReportController;
use App\Http\Controllers\AttendanceSettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DocumentTrackingController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeReportController;
use App\Http\Controllers\EmploymentClassificationController;
use App\Http\Controllers\GovernmentRemittanceReportController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\InternalOrganizationController;
use App\Http\Controllers\InternalOrgDeductionController;
use App\Http\Controllers\JobOrderPositionController;
use App\Http\Controllers\LeaveAccrualController;
use App\Http\Controllers\LeaveApplicationController;
use App\Http\Controllers\LeaveCalendarController;
use App\Http\Controllers\LeaveEntitlementController;
use App\Http\Controllers\LeaveReportController;
use App\Http\Controllers\LeaveSettingsController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\LoanEntryController;
use App\Http\Controllers\OtherDeductionEntryController;
use App\Http\Controllers\PayrollDeductionSettingsController;
use App\Http\Controllers\PayrollProcessingController;
use App\Http\Controllers\PayrollRegisterController;
use App\Http\Controllers\PayrollReportController;
use App\Http\Controllers\PaySlipGenerationController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\RecognitionLogController;
use App\Http\Controllers\ReportsAndAnalyticsController;
use App\Http\Controllers\SalaryGradeTableController;
use App\Http\Controllers\UnitController;
// Leave
use App\Http\Controllers\UserController;
use App\Http\Controllers\WhereaboutSlipController;
use Illuminate\Support\Facades\Route;
// reports and analytics
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::group(['middleware' => ['auth', 'verified']], function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // User Routes
    Route::prefix('users')->name('user.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
    });

    /*
    |--------------------------------------------------------------------------
    | Employee
    |--------------------------------------------------------------------------
    */
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

        Route::post('/{employee}/avatar', [EmployeeController::class, 'updateAvatar'])->name('avatar.update');

        // Employment Classifications
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

        // Files
        Route::post('/{employee}/files', [EmployeeController::class, 'storeFile'])->name('file.store');
        Route::delete('/{employee}/files/{file}', [EmployeeController::class, 'destroyFile'])->name('file.destroy');

        // Service Records
        Route::post('/{employee}/service-record', [EmployeeController::class, 'storeServiceRecord'])->name('service-record.store');
        Route::put('/{employee}/service-record/{record}', [EmployeeController::class, 'updateServiceRecord'])->name('service-record.update');
        Route::delete('/{employee}/service-record/{record}', [EmployeeController::class, 'destroyServiceRecord'])->name('service-record.destroy');

        // Allowances
        Route::post('/{employee}/allowances', [EmployeeController::class, 'storeAllowance'])->name('allowance.store');
        Route::put('/{employee}/allowances/{allowance}', [EmployeeController::class, 'updateAllowance'])->name('allowance.update');
        Route::delete('/{employee}/allowances/{allowance}', [EmployeeController::class, 'destroyAllowance'])->name('allowance.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Organization - Units
    |--------------------------------------------------------------------------
    */
    Route::prefix('organization/units')->name('unit.')->group(function () {
        Route::get('/', [UnitController::class, 'index'])->name('index');
        Route::post('/', [UnitController::class, 'store'])->name('store');
        Route::delete('/bulk-destroy', [UnitController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::get('/{unit}', [UnitController::class, 'show'])->name('show');
        Route::put('/{unit}', [UnitController::class, 'update'])->name('update');
        Route::delete('/{unit}', [UnitController::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Organization - Departments
    |--------------------------------------------------------------------------
    */
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

    /*
    |--------------------------------------------------------------------------
    | Organization - Internal Organizations
    |--------------------------------------------------------------------------
    */
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
        Route::post('/org-types', [InternalOrganizationController::class, 'storeOrgType'])->name('org-type.store');
    });

    /*
    |--------------------------------------------------------------------------
    | Organization - Divisions
    |--------------------------------------------------------------------------
    */
    Route::prefix('organization/divisions')->name('division.')->group(function () {
        Route::get('/', [DivisionController::class, 'index'])->name('index');
        Route::get('/{division}', [DivisionController::class, 'show'])->name('show');
        Route::post('/', [DivisionController::class, 'store'])->name('store');
        Route::put('/{division}', [DivisionController::class, 'update'])->name('update');
        Route::delete('/bulk-destroy', [DivisionController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::delete('/{division}', [DivisionController::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Organization - Positions
    |--------------------------------------------------------------------------
    */
    Route::prefix('organization/positions')->name('position.')->group(function () {
        Route::get('/', [PositionController::class, 'index'])->name('index');
        Route::get('/{position}', [PositionController::class, 'show'])->name('show');
        Route::post('/', [PositionController::class, 'store'])->name('store');
        Route::put('/{position}', [PositionController::class, 'update'])->name('update');
        Route::delete('/bulk-destroy', [PositionController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::delete('/{position}', [PositionController::class, 'destroy'])->name('destroy');
    });

    // Position employees
    Route::get('organization/position/{position}/employees', [PositionController::class, 'employees'])
        ->name('position.employees');

    Route::prefix('organization/job-order-positions')->name('job-order-position.')->group(function () {
        Route::get('/', [JobOrderPositionController::class, 'index'])->name('index');
        Route::post('/', [JobOrderPositionController::class, 'store'])->name('store');
        Route::delete('/bulk-destroy', [JobOrderPositionController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::put('/{position}', [JobOrderPositionController::class, 'update'])->name('update');
        Route::delete('/{position}', [JobOrderPositionController::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Organization - Organizational Chart
    |--------------------------------------------------------------------------
    */
    Route::get('/organization/organizational_chart', [\App\Http\Controllers\OrganizationalChartController::class, 'index'])->name('organization.chart');
    Route::get('/organization/organizational_chart/{department}', [\App\Http\Controllers\OrganizationalChartController::class, 'show'])->name('organization.chart.show');

    /*
    |--------------------------------------------------------------------------
    | Attendance - API calls
    |--------------------------------------------------------------------------
    */
    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::post('/clock-in', [AttendanceController::class, 'clockIn'])->name('clock-in');
        Route::post('/enroll', [AttendanceController::class, 'enroll'])->name('enroll');
        Route::post('/detect', [AttendanceController::class, 'detect'])->name('detect');
    });

    /*
    |--------------------------------------------------------------------------
    | Attendance - Recognition Logs
    | ⚠️ TODO: Doc 3 uses RecognitionLogController, Doc 4 uses AttendanceLogController
    |          for this same route. Confirm which is correct and remove the other.
    |--------------------------------------------------------------------------
    */
    Route::prefix('attendance/recognition-logs')->name('recognition-logs.')->group(function () {
        Route::get('/', [RecognitionLogController::class, 'index'])->name('index'); // ⚠️ swap to AttendanceLogController if renamed
    });

    /*
    |--------------------------------------------------------------------------
    | Attendance - Whereabout Slips
    |--------------------------------------------------------------------------
    */
    Route::prefix('attendance/whereabout-slips')->name('whereabout-slip.')->group(function () {
        Route::get('/', [WhereaboutSlipController::class, 'index'])->name('index');
        Route::post('/', [WhereaboutSlipController::class, 'store'])->name('store');
        Route::put('/{whereaboutSlip}', [WhereaboutSlipController::class, 'update'])->name('update');
        Route::put('/{whereaboutSlip}/return', [WhereaboutSlipController::class, 'logReturn'])->name('log-return');
        Route::delete('/{whereaboutSlip}', [WhereaboutSlipController::class, 'destroy'])->name('destroy');
        Route::delete('/', [WhereaboutSlipController::class, 'bulkDestroy'])->name('bulk-destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Attendance - Records (from main - NEW)
    |--------------------------------------------------------------------------
    */
    Route::get('attendance/records', [AttendanceRecordController::class, 'index'])
        ->name('attendance-record.index');
    Route::post('attendance/records/recompute', [AttendanceRecordController::class, 'recompute'])
        ->name('attendance-record.recompute');
    Route::post('attendance/records/sync-absent', [AttendanceRecordController::class, 'syncAbsent'])
        ->name('attendance-record.sync-absent');

    /*
    |--------------------------------------------------------------------------
    | Attendance - Settings (from main - NEW)
    |--------------------------------------------------------------------------
    */
    Route::get('attendance/settings', [AttendanceSettingController::class, 'index'])
        ->name('attendance-settings.index');
    Route::post('attendance/settings', [AttendanceSettingController::class, 'store'])
        ->name('attendance-settings.store');
    Route::put('attendance/settings/{attendanceSetting}', [AttendanceSettingController::class, 'update'])
        ->name('attendance-settings.update');
    Route::delete('attendance/settings/{attendanceSetting}', [AttendanceSettingController::class, 'destroy'])
        ->name('attendance-settings.destroy');

    /*
    |--------------------------------------------------------------------------
    | Attendance - Holiday Management
    |--------------------------------------------------------------------------
    */
    Route::resource('holiday', HolidayController::class)->parameters([
        'holiday' => 'holiday:holiday_id',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Leave
    |--------------------------------------------------------------------------
    */
    Route::prefix('leave')->name('leave.')->group(function () {
        Route::get('/leave-calendar', [LeaveCalendarController::class, 'index'])->name('leave-calendar');

        // Leave Settings
        Route::get('/leave-settings', [LeaveSettingsController::class, 'index'])->name('leave-settings');

        // Leave Types
        Route::prefix('leave-type')->name('leave-type.')->group(function () {
            Route::post('/', [LeaveTypeController::class, 'store'])->name('store');
            Route::put('/{leave}', [LeaveTypeController::class, 'update'])->name('update');
            Route::delete('/{leave}', [LeaveTypeController::class, 'destroy'])->name('destroy');
            Route::delete('/', [LeaveTypeController::class, 'bulkDestroy'])->name('bulk-destroy');
        });

        // Leave Entitlements
        Route::prefix('leave-entitlement')->name('leave-entitlement.')->group(function () {
            Route::post('/', [LeaveEntitlementController::class, 'store'])->name('store');
            Route::put('/{entitlement}', [LeaveEntitlementController::class, 'update'])->name('update');
            Route::delete('/{entitlement}', [LeaveEntitlementController::class, 'destroy'])->name('destroy');
            Route::delete('/', [LeaveEntitlementController::class, 'bulkDestroy'])->name('bulk-destroy');
        });

        // Leave Accrual
        Route::prefix('accrual')->name('accrual.')->group(function () {
            Route::get('/', [LeaveAccrualController::class, 'index'])->name('index');
            Route::get('/preview', [LeaveAccrualController::class, 'preview'])->name('preview');
            Route::post('/confirm', [LeaveAccrualController::class, 'confirm'])->name('confirm');
            Route::post('/post', [LeaveAccrualController::class, 'post'])->name('post');
            Route::get('/posted', [LeaveAccrualController::class, 'posted'])->name('posted');       // from main (NEW)
            Route::get('/history', [LeaveAccrualController::class, 'history'])->name('history');
            Route::get('/balances', [LeaveAccrualController::class, 'balances'])->name('balances'); // from main (NEW)
        });

        // Leave Application
        Route::get('/leave-application', [LeaveApplicationController::class, 'index'])->name('leave-application.index');
    });

    /*
    |--------------------------------------------------------------------------
    | Payroll
    |--------------------------------------------------------------------------
    */
    Route::prefix('payroll')->group(function () {

        // Payroll Processing
        Route::get('/', [PayrollProcessingController::class, 'index'])->name('payroll.index');

        // Payroll Register
        Route::prefix('payroll-register')->name('payroll-register.')->group(function () {
            Route::get('/', [PayrollRegisterController::class, 'index'])->name('index');
            Route::get('/{period}', [PayrollRegisterController::class, 'show'])->name('show');
        });

        Route::get('/check-duplicate', [PayrollProcessingController::class, 'checkDuplicate'])->name('check-duplicate');

        // Government Remittance Report
        Route::get('/governmentremittancereport', [GovernmentRemittanceReportController::class, 'index'])
            ->name('governmentremittancereport.index');

        // Pay Slip Generation
        Route::get('/payslip-generation', [PaySlipGenerationController::class, 'index'])
            ->name('payslipgeneration.index');

        // Processing API endpoints
        Route::post('/process-new', [PayrollProcessingController::class, 'processNew'])->name('payroll.process-new');
        Route::post('/finalize', [PayrollProcessingController::class, 'finalizePayroll'])->name('payroll.finalize');
        Route::get('/attendance-summary', [PayrollProcessingController::class, 'attendanceSummary'])->name('payroll.attendance-summary');

        // Payroll Period Management
        Route::prefix('periods')->name('payroll.periods.')->group(function () {
            Route::post('/', [PayrollProcessingController::class, 'storePeriod'])->name('store');
            Route::delete('/{period}', [PayrollProcessingController::class, 'destroyPeriod'])->name('destroy');
            Route::post('/{period}/process', [PayrollProcessingController::class, 'process'])->name('process');
            Route::post('/{period}/post', [PayrollProcessingController::class, 'postPeriod'])->name('post');
            Route::post('/{period}/lock', [PayrollProcessingController::class, 'lockPeriod'])->name('lock');
        });

        // Earnings & Deductions
        Route::prefix('earnings-deductions')->group(function () {

            Route::prefix('allowance')->name('allowancemanagement.')->group(function () {
                Route::get('/', [AllowanceManagementController::class, 'index'])->name('index');
                Route::post('/', [AllowanceManagementController::class, 'store'])->name('store');
                Route::put('/{allowance}', [AllowanceManagementController::class, 'update'])->name('update');
                Route::delete('/{allowance}', [AllowanceManagementController::class, 'destroy'])->name('destroy');
            });

            Route::prefix('loan-entry')->name('loanentry.')->group(function () {
                Route::get('/', [LoanEntryController::class, 'index'])->name('index');
                Route::post('/', [LoanEntryController::class, 'store'])->name('store');
                Route::put('/{loan}', [LoanEntryController::class, 'update'])->name('update');
                Route::delete('/{loan}', [LoanEntryController::class, 'destroy'])->name('destroy');
            });

            Route::prefix('internal-org-deductions')->name('internal-org-deductions.')->group(function () {
                Route::get('/', [InternalOrgDeductionController::class, 'index'])->name('index');
                Route::post('/', [InternalOrgDeductionController::class, 'store'])->name('store');
                Route::delete('/bulk-destroy', [InternalOrgDeductionController::class, 'bulkDestroy'])->name('bulk-destroy');
                Route::patch('/{internalOrgDeduction}/amount', [InternalOrgDeductionController::class, 'updateAmount'])->name('updateAmount');
                Route::delete('/{internalOrgDeduction}', [InternalOrgDeductionController::class, 'destroy'])->name('destroy');
            });

            Route::prefix('other-deductions')->name('otherdeductions.')->group(function () {
                Route::get('/', [OtherDeductionEntryController::class, 'index'])->name('index');
                Route::post('/', [OtherDeductionEntryController::class, 'store'])->name('store');
                Route::delete('/bulk-destroy', [OtherDeductionEntryController::class, 'bulkDestroy'])->name('bulk-destroy');
                Route::patch('/{otherDeduction}/amount', [OtherDeductionEntryController::class, 'updateAmount'])->name('updateAmount');
                Route::delete('/{otherDeduction}', [OtherDeductionEntryController::class, 'destroy'])->name('destroy');
            });
        });

        // Configuration
        Route::prefix('configuration')->group(function () {

            Route::prefix('deduction-settings')->name('payroll.deduction-settings.')->group(function () {
                Route::get('/', [PayrollDeductionSettingsController::class, 'index'])->name('index');
                Route::put('/', [PayrollDeductionSettingsController::class, 'update'])->name('update');
                Route::put('/priority-order', [PayrollDeductionSettingsController::class, 'updatePriorityOrder'])->name('priority-order.update');
                Route::put('/floor-rules', [PayrollDeductionSettingsController::class, 'updateFloorRules'])->name('floor-rules.update');
            });

            Route::prefix('salary-grade')->name('payroll.salary-grade.')->group(function () {
                Route::get('/', [SalaryGradeTableController::class, 'index'])->name('index');
                Route::post('/', [SalaryGradeTableController::class, 'store'])->name('store');
                Route::get('/{salaryGrade}', [SalaryGradeTableController::class, 'show'])->name('show');
                Route::put('/{salaryGrade}', [SalaryGradeTableController::class, 'update'])->name('update');
                Route::delete('/{salaryGrade}', [SalaryGradeTableController::class, 'destroy'])->name('destroy');
                Route::post('/{salaryGrade}/activate', [SalaryGradeTableController::class, 'activate'])->name('activate');
            });
        });
    });

    /*
    |--------------------------------------------------------------------------
    | System
    |--------------------------------------------------------------------------
    */
    Route::get('/document_tracking', [DocumentTrackingController::class, 'index'])->name('document_tracking.index');

    Route::get('/reports_and_analytics', [ReportsAndAnalyticsController::class, 'index'])->name('reports_and_analytics.index');

    // Attendance Report (from main - NEW)
    Route::prefix('reports')->name('reports_and_analytics.')->group(function () {
        Route::inertia('/leave', 'ReportsAndAnalytics\Leave\LeaveIndexa')->name('leave');

        Route::get('/attendance-report', [AttendanceReportController::class, 'index'])
            ->name('attendance-report.index');

        Route::get('/employee-report', [EmployeeReportController::class, 'index'])
            ->name('employee-report.index');

        Route::get('/leave-report', [LeaveReportController::class, 'index'])
            ->name('leave-report.index');

        Route::get('/payroll-report', [PayrollReportController::class, 'index'])
            ->name('payroll-report.index');

    });

    Route::prefix('announcement')->name('announcement.')->group(function () {
        Route::get('/', [AnnouncementController::class, 'index'])->name('index');
    });

    Route::get('/activity_logs', [ActivityLogsController::class, 'index'])->name('activity_logs.index');
});

require __DIR__.'/settings.php';
