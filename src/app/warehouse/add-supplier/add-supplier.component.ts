import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ConfigService } from "../../services/config.service";
import { CustomAlertService } from "../../services/custom-alert.service";
import { Location } from '@angular/common';

@Component({
  selector: 'app-add-supplier',
  templateUrl: './add-supplier.component.html',
  styleUrls: ['./add-supplier.component.css'],
})
export class AddSupplierComponent implements OnInit {
  @ViewChild('supplierForm') supplierForm!: NgForm;

  supplier = {
    name: '',
    companyName: '',
    phone: '',
    address: '',
    email: '', // Optional field
    notes: ''  // Optional field
  };

  isSubmitting: boolean = false;
  showOptionalFields: boolean = false;
  formTouched: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private customAlertService: CustomAlertService,
    private location: Location
  ) {}

  ngOnInit(): void {
    // Initialize any data or settings needed
  }

  // Toggle the optional fields section
  toggleOptionalFields(): void {
    this.showOptionalFields = !this.showOptionalFields;
  }

  // Calculate form completion percentage
  getFormCompletionPercentage(): number {
    if (!this.formTouched) {
      return 0;
    }

    // Calculate based on required fields
    let filledRequired = 0;
    const totalRequired = 4; // name, companyName, phone, address

    if (this.supplier.name) filledRequired++;
    if (this.supplier.companyName) filledRequired++;
    if (this.supplier.phone) filledRequired++;
    if (this.supplier.address) filledRequired++;

    // Calculate percentage with a minimum of 10% even when empty
    const basePercentage = Math.round((filledRequired / totalRequired) * 100);
    return Math.max(basePercentage, 10);
  }

  // Go back to previous page
  goBack(): void {
    // Check if form has been modified
    if (this.formTouched) {
      this.customAlertService.confirm(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to leave?'
      ).then((confirmed) => {
        if (confirmed) {
          this.location.back();
        }
      });
    } else {
      this.location.back();
    }
  }

  // Form submission
  onSubmit(): void {
    if (this.supplierForm.invalid) {
      // Trigger validation on all fields
      Object.keys(this.supplierForm.controls).forEach(key => {
        const control = this.supplierForm.controls[key];
        control.markAsTouched();
      });

      this.customAlertService.show('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    this.isSubmitting = true;

    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // Prepare the payload - remove empty optional fields
    const payload = {
      ...this.supplier
    };

    if (!payload.email) delete payload.email;
    if (!payload.notes) delete payload.notes;

    // Make the POST request to the API
    this.http
      .post(`${this.configService.apiUrl}admin/supplier/`, payload, { headers })
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.customAlertService.show('Success', 'Supplier added successfully!');

          // Show success message then navigate after a delay
          setTimeout(() => {
            this.router.navigate(['/warehouse/suppliers']);
          }, 2000);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Failed to add supplier:', error);

          // Show detailed error message if available
          const errorMessage = error.error?.message || 'Failed to add supplier. Please try again.';
          this.customAlertService.show('Error', errorMessage);
        },
      });
  }

  // Track form changes to update progress and detect unsaved changes
  onInputChange(): void {
    this.formTouched = true;
  }
}
