import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import {ConfigService} from "../../services/config.service";

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

  constructor(private http: HttpClient, private router: Router,private configService: ConfigService) {}

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
          alert('Supplier added successfully!');
          this.router.navigate(['/warehouse/suppliers']);
        },
        error: (error) => {
          console.error('Failed to add supplier:', error);
          alert('Failed to add supplier. Please try again.');
        },
      });
  }
}
