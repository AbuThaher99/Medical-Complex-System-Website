import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import {ConfigService} from "../../services/config.service";
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-add-supplier',
  templateUrl: './add-supplier.component.html',
  styleUrls: ['./add-supplier.component.css'],
})
export class AddSupplierComponent {
  supplier = {
    name: '',
    companyName: '', // User will enter a string value
    phone: '',
    address: '',
  };

  constructor(private http: HttpClient, private router: Router,private configService: ConfigService,private customAlertService: CustomAlertService) {}

  onSubmit(): void {
    const token = localStorage.getItem('access_token'); // Retrieve the token from localStorage
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // Make the POST request to the API
    this.http
      .post(`${this.configService.apiUrl}admin/supplier/`, this.supplier, { headers })
      .subscribe({
        next: (response) => {
          this.customAlertService.show('Success', 'Supplier added successfully!');
          setTimeout(() => {
            this.router.navigate(['/warehouse/suppliers']);
          }, 2000);
        },
        error: (error) => {
          console.error('Failed to add supplier:', error);
          this.customAlertService.show('Error', 'Failed to add supplier. Please try again.');
        },
      });
  }
}
