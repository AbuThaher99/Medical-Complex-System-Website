import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import {ConfigService} from "../../services/config.service";

@Component({
  selector: 'app-deleted-suppliers',
  templateUrl: './deleted-suppliers.component.html',
  styleUrls: ['./deleted-suppliers.component.css'],
})
export class DeletedSuppliersComponent implements OnInit {
  filterForm: FormGroup;
  deletedSuppliers: any[] = [];
  page: number = 1;
  size: number = 10;
  totalPages: number = 1;

  constructor(private fb: FormBuilder, private http: HttpClient,private configService: ConfigService) {
    this.filterForm = this.fb.group({
      search: [''],
      companyName: [''],
    });
  }

  ngOnInit(): void {
    this.loadDeletedSuppliers();

    // Real-time filtering
    this.filterForm.valueChanges.subscribe(() => {
      this.page = 1; // Reset to the first page on filter change
      this.loadDeletedSuppliers();
    });
  }

  loadDeletedSuppliers(): void {
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
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http
      .get<any>(`${this.configService.apiUrl}admin/supplier/deleted`, { params, headers })
      .subscribe(
        (response) => {
          this.deletedSuppliers = response.content;
          this.totalPages = response.totalPages;
        },
        (error) => {
          alert('Error loading deleted suppliers: ' + error.message);
        }
      );
  }

  restoreSupplier(supplierId: number): void {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http
      .put(`${this.configService.apiUrl}admin/supplier/restore/${supplierId}`, null, { headers })
      .subscribe(
        () => {
          alert('Supplier restored successfully!');
          this.loadDeletedSuppliers(); // Refresh the list
        },
        (error) => {
          alert('Error restoring supplier: ' + error.message);
        }
      );
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadDeletedSuppliers();
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadDeletedSuppliers();
    }
  }
}
