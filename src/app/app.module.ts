import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './app-routing.module';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminComponent } from './admin/admin.component';
import { DoctorComponent } from './doctor/doctor.component';
import { PatientComponent } from './patient/patient.component';
import { SecretaryComponent } from './secretary/secretary.component';
import { WarehouseComponent } from './warehouse/warehouse.component';
import { ManageuserComponent } from './admin/manageuser/manageuser.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { AddUserComponent } from './admin/add-user/add-user.component';
import { DeletedUsersComponent } from './admin/deleted-users/deleted-users.component';
import { AddDepartmentComponent } from './admin/add-department/add-department.component';
import { DepartmentsComponent } from './admin/departments/departments.component';
import { DeletedDepartmentComponent } from './admin/deleted-department/deleted-department.component';
import { AddSupplierComponent } from './warehouse/add-supplier/add-supplier.component';
import { SuppliersComponent } from './warehouse/suppliers/suppliers.component';
import { DeletedSuppliersComponent } from './warehouse/deleted-suppliers/deleted-suppliers.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { AddMedicineComponent } from './warehouse/add-medicine/add-medicine.component';
import { ManageMedicineComponent } from './warehouse/manage-medicine/manage-medicine.component';
import { DeletedMedicineComponent } from './warehouse/deleted-medicine/deleted-medicine.component';
import { AddWarehouseComponent } from './warehouse/add-warehouse/add-warehouse.component';
import { ManageWarehouseComponent } from './warehouse/manage-warehouse/manage-warehouse.component';
import { DeletedWarehouseComponent } from './warehouse/deleted-warehouse/deleted-warehouse.component';
import { AddTreatmentComponent } from './doctor/add-treatment/add-treatment.component';
import { TreatmentsComponent } from './doctor/treatments/treatments.component';
import { PatientsComponent } from './secretary/patients/patients.component';
import { PatientMedicinesComponent } from './secretary/patient-medicines/patient-medicines.component';
import { AddDonorComponent } from './secretary/add-donor/add-donor.component';
import { DonorsComponent } from './secretary/donors/donors.component';
import { DeletedDonorComponent } from './secretary/deleted-donor/deleted-donor.component';
import { DonationsComponent } from './secretary/donations/donations.component';
import { TakeBloodComponent } from './secretary/take-blood/take-blood.component';
import { PatientBloodComponent } from './secretary/patient-blood/patient-blood.component';
import { DeletedPatientBloodComponent } from './secretary/deleted-patient-blood/deleted-patient-blood.component';
import { PatientTreatmentExcelComponent } from './secretary/storage/patient-treatment-excel/patient-treatment-excel.component';
import { PatientExcelComponent } from './secretary/storage/patient-excel/patient-excel.component';
import { MedicineExcelComponent } from './secretary/storage/medicine-excel/medicine-excel.component';
import { CheckInOutComponent } from './secretary/check-in-out/check-in-out.component';
import { MyTreatmentsComponent } from './patient/my-treatments/my-treatments.component';
import { FeedbackComponent } from './doctor/feedback/feedback.component';
import { TreatmentProfitComponent } from './admin/treatment-profit/treatment-profit.component';
import { SafeUrlPipe } from './safe-url.pipe';
import { SalaryReportComponent } from './admin/salary-report/salary-report.component';
import { SignupPatientComponent } from './signup-patient/signup-patient.component';
import { CustomAlertComponent } from './custom-alert/custom-alert.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    AdminComponent,
    DoctorComponent,
    PatientComponent,
    SecretaryComponent,
    WarehouseComponent,
    ManageuserComponent,
    LayoutComponent,
    AddUserComponent,
    DeletedUsersComponent,
    AddDepartmentComponent,
    DepartmentsComponent,
    DeletedDepartmentComponent,
    AddSupplierComponent,
    SuppliersComponent,
    DeletedSuppliersComponent,
    AddMedicineComponent,
    ManageMedicineComponent,
    DeletedMedicineComponent,
    AddWarehouseComponent,
    ManageWarehouseComponent,
    DeletedWarehouseComponent,
    AddTreatmentComponent,
    TreatmentsComponent,
    PatientsComponent,
    PatientMedicinesComponent,
    AddDonorComponent,
    DonorsComponent,
    DeletedDonorComponent,
    DonationsComponent,
    TakeBloodComponent,
    PatientBloodComponent,
    DeletedPatientBloodComponent,
    PatientTreatmentExcelComponent,
    PatientExcelComponent,
    MedicineExcelComponent,
    CheckInOutComponent,
    MyTreatmentsComponent,
    FeedbackComponent,
    TreatmentProfitComponent,
    SafeUrlPipe,
    SalaryReportComponent,
    SignupPatientComponent,
    CustomAlertComponent,
    LoadingSpinnerComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,

    ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
