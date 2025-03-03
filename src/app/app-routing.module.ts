import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { WarehouseComponent } from './warehouse/warehouse.component';
import { SecretaryComponent } from './secretary/secretary.component';
import { PatientComponent } from './patient/patient.component';
import { DoctorComponent } from './doctor/doctor.component';
import { AdminComponent } from './admin/admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageuserComponent } from './admin/manageuser/manageuser.component';
import { LayoutComponent } from './shared/layout/layout.component';
import {AddUserComponent} from "./admin/add-user/add-user.component";
import {DeletedUsersComponent} from "./admin/deleted-users/deleted-users.component";
import {AddDepartmentComponent} from "./admin/add-department/add-department.component";
import {DepartmentsComponent} from "./admin/departments/departments.component";
import {DeletedDepartmentComponent} from "./admin/deleted-department/deleted-department.component";
import {AddSupplierComponent} from "./warehouse/add-supplier/add-supplier.component";
import {SuppliersComponent} from "./warehouse/suppliers/suppliers.component";
import {DeletedSuppliersComponent} from "./warehouse/deleted-suppliers/deleted-suppliers.component";
import {AddMedicineComponent} from "./warehouse/add-medicine/add-medicine.component";
import {ManageMedicineComponent} from "./warehouse/manage-medicine/manage-medicine.component";
import {DeletedMedicineComponent} from "./warehouse/deleted-medicine/deleted-medicine.component";
import {AddWarehouseComponent} from "./warehouse/add-warehouse/add-warehouse.component";
import {ManageWarehouseComponent} from "./warehouse/manage-warehouse/manage-warehouse.component";
import {DeletedWarehouseComponent} from "./warehouse/deleted-warehouse/deleted-warehouse.component";
import {AddTreatmentComponent} from "./doctor/add-treatment/add-treatment.component";
import {TreatmentsComponent} from "./doctor/treatments/treatments.component";
import {PatientsComponent} from "./secretary/patients/patients.component";
import {PatientMedicinesComponent} from "./secretary/patient-medicines/patient-medicines.component";
import {AddDonorComponent} from "./secretary/add-donor/add-donor.component";
import {DonorsComponent} from "./secretary/donors/donors.component";
import {DeletedDonorComponent} from "./secretary/deleted-donor/deleted-donor.component";
import {DonationsComponent} from "./secretary/donations/donations.component";
import {TakeBloodComponent} from "./secretary/take-blood/take-blood.component";
import {PatientBloodComponent} from "./secretary/patient-blood/patient-blood.component";
import {DeletedPatientBloodComponent} from "./secretary/deleted-patient-blood/deleted-patient-blood.component";
import {
  PatientTreatmentExcelComponent
} from "./secretary/storage/patient-treatment-excel/patient-treatment-excel.component";
import {PatientExcelComponent} from "./secretary/storage/patient-excel/patient-excel.component";
import {MedicineExcelComponent} from "./secretary/storage/medicine-excel/medicine-excel.component";
import {CheckInOutComponent} from "./secretary/check-in-out/check-in-out.component";
import {MyTreatmentsComponent} from "./patient/my-treatments/my-treatments.component";
import {FeedbackComponent} from "./doctor/feedback/feedback.component";
import {TreatmentProfitComponent} from "./admin/treatment-profit/treatment-profit.component";
import {SalaryReportComponent} from "./admin/salary-report/salary-report.component";
import {SignupPatientComponent} from "./signup-patient/signup-patient.component";

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'admin', component: AdminComponent },
      { path: 'doctor', component: DoctorComponent },
      { path: 'patient', component: PatientComponent },
      { path: 'secretary', component: SecretaryComponent },
      { path: 'warehouse', component: WarehouseComponent },
      { path: 'admin/manageuser', component: ManageuserComponent },
      {path: 'admin/add-user', component: AddUserComponent,},
      {path: 'admin/delete-user', component: DeletedUsersComponent,},
      {path: 'admin/add-department', component: AddDepartmentComponent,},
      {path:'admin/departments', component: DepartmentsComponent,},
      { path: 'admin/deleted-department', component: DeletedDepartmentComponent },
      {path: 'warehouse/add-supplier', component: AddSupplierComponent,},
      {path: 'warehouse/suppliers', component: SuppliersComponent,},
      {path: 'warehouse/deleted-suppliers', component: DeletedSuppliersComponent,},
      {path: 'warehouse/add-medicine', component: AddMedicineComponent,},
      {path: 'warehouse/manage-medicine', component: ManageMedicineComponent,},
      {path: 'warehouse/deleted-medicine', component: DeletedMedicineComponent,},
      {path: 'warehouse/add-warehouse', component: AddWarehouseComponent,},
      {path: 'warehouse/manage-warehouse', component: ManageWarehouseComponent,},
      {path: 'warehouse/deleted-warehouse', component: DeletedWarehouseComponent,},
      {path: 'doctor/add-treatment', component: AddTreatmentComponent,},
      {path: 'doctor/treatments', component: TreatmentsComponent,},
      {path:'secretary/patients', component: PatientsComponent,},
      {path:'secretary/patient-medicines', component: PatientMedicinesComponent,},
      {path: 'secretary/add-donor', component: AddDonorComponent,},
      {path: 'secretary/donors', component: DonorsComponent },
      {path: 'secretary/deleted-donor', component: DeletedDonorComponent },
      {path: 'secretary/donations', component: DonationsComponent },
      {path: 'secretary/take-blood', component: TakeBloodComponent },
      {path: 'secretary/patient-blood', component: PatientBloodComponent },
      {path: 'secretary/deleted-patient-blood', component: DeletedPatientBloodComponent },
      { path: 'secretary/storage/patient-treatment-excel', component: PatientTreatmentExcelComponent },
      { path: 'secretary/storage/patient-excel', component: PatientExcelComponent },
      { path: 'secretary/storage/medicine-excel', component: MedicineExcelComponent },
      {path :'secretary/check-in-out', component: CheckInOutComponent},
      {path: 'patient/my-treatments', component: MyTreatmentsComponent},
      { path: 'doctor/feedback', component: FeedbackComponent },
      {path: 'admin/treatment-profit', component: TreatmentProfitComponent},
      {path: 'admin/salary-report' , component: SalaryReportComponent},
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'signup', component: SignupPatientComponent },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
