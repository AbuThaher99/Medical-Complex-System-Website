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
