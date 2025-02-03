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

    ],
  },

  { path: 'login', component: LoginComponent },

  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
