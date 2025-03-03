import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {ConfigService} from "../../services/config.service";
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css'],
})
export class SuppliersComponent implements OnInit {
  filterForm: FormGroup;
  suppliers: any[] = []; // Use `any` instead of a model
  page: number = 1;
  size: number = 10;
  totalPages: number = 1;
  showEditModal: boolean = false;
  showMedicinesModal: boolean = false;
  selectedSupplier: any = null; // Selected supplier for editing or viewing medicines
  medicines: any[] = []; // Medicines for the selected supplier
  constructor(private fb: FormBuilder, private http: HttpClient,private configService: ConfigService,private customAlertService: CustomAlertService) {
    this.filterForm = this.fb.group({
      search: [''],
      companyName: [''],
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();

    // Real-time filtering
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after the user stops typing
        distinctUntilChanged(), // Only emit if the value has changed
        switchMap(async () => this.loadSuppliers()) // Call the API
      )
      .subscribe();
  }

  loadSuppliers() {
    const { search, companyName } = this.filterForm.value;
    let params = new HttpParams()
      .set('page', this.page.toString())
      .set('size', this.size.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (companyName) {
      params = params.set('companyName', companyName);
    }
    const token = localStorage.getItem('access_token');
    // define the header for the request
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .get<any>(`${this.configService.apiUrl}admin/supplier`, { params , headers })
      .subscribe((response) => {
        this.suppliers = response.content; // Access the `content` property directly
        this.totalPages = response.totalPages; // Access the `totalPages` property directly
      });
  }
  onUpdate(supplier: any) {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // Prepare the updated data (example only; you can modify it as needed)
    const updatedSupplier = {
      name: supplier.name,
      companyName: supplier.companyName,
      phone: supplier.phone,
      address: supplier.address,
    };

    this.http
      .put(
        `${this.configService.apiUrl}admin/supplier/?id=${supplier.id}`,
        updatedSupplier,
        { headers }
      )
      .subscribe(
        (response) => {
          this.customAlertService.show('Success', 'Supplier updated successfully!');

          this.loadSuppliers();
        },
        (error) => {
          this.customAlertService.show('Error', 'Error updating supplier: ' + error.message);

        }
      );
  }

  onDelete(supplier: any) {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.customAlertService.confirm('Confirm Delete', `Are you sure you want to delete ${supplier.name}?`).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.http
        .delete(`${this.configService.apiUrl}admin/supplier/${supplier.id}`, { headers })
        .subscribe(
          (response) => {
            this.customAlertService.show('Success', 'Supplier deleted successfully!');
            this.loadSuppliers(); // Refresh the supplier list
          },
          (error) => {
            this.customAlertService.show('Error', 'Error deleting supplier: ' + error.message);
          }
        );
    });
  }



  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadSuppliers();
    }
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.loadSuppliers();
    }
  }

  openEditModal(supplier: any) {
    this.selectedSupplier = { ...supplier }; // Clone the supplier object
    this.showEditModal = true;
  }

  // Close the Update Supplier modal
  closeEditModal() {
    this.showEditModal = false;
    this.selectedSupplier = null;
  }

  // Save the updated supplier details
  saveUpdatedSupplier() {
    this.onUpdate(this.selectedSupplier);
    this.closeEditModal();
  }

  // Open the Show Medicines modal
  openMedicinesModal(supplier: any) {
    this.selectedSupplier = supplier;
    this.medicines = supplier.medicines;
    this.showMedicinesModal = true;
  }

  // Close the Show Medicines modal
  closeMedicinesModal() {
    this.showMedicinesModal = false;
    this.selectedSupplier = null;
  }
}
