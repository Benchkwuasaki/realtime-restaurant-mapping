import DashboardController from './DashboardController'
import AttendanceController from './AttendanceController'
import DocumentTrackingController from './DocumentTrackingController'
import EmployeeController from './EmployeeController'
import PayrollController from './PayrollController'
import BenefitsController from './BenefitsController'
import ReportsAndAnalyticsController from './ReportsAndAnalyticsController'
import ActivityLogsController from './ActivityLogsController'
import Settings from './Settings'
const Controllers = {
    DashboardController: Object.assign(DashboardController, DashboardController),
AttendanceController: Object.assign(AttendanceController, AttendanceController),
DocumentTrackingController: Object.assign(DocumentTrackingController, DocumentTrackingController),
EmployeeController: Object.assign(EmployeeController, EmployeeController),
PayrollController: Object.assign(PayrollController, PayrollController),
BenefitsController: Object.assign(BenefitsController, BenefitsController),
ReportsAndAnalyticsController: Object.assign(ReportsAndAnalyticsController, ReportsAndAnalyticsController),
ActivityLogsController: Object.assign(ActivityLogsController, ActivityLogsController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers