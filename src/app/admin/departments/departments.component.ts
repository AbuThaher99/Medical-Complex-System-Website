import { Component, OnInit } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfigService } from '../../services/config.service';


import {Subject} from "rxjs";

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css'],
})
export class DepartmentsComponent implements OnInit {
  departments: any[] = [];
  page = 1;
  size = 10;
  search = '';
  totalDepartments = 0;

  // For Edit Modal
  showEditModal = false;
  selectedDepartment: any = null;
  private searchSubject = new Subject<string>();

  // For Heads and Secretaries
  heads: any[] = [];
  secretaries: any[] = [];
  isLoadingHeads = false;
  isLoadingSecretaries = false;
  selectedHeadInfo: string = '';
  selectedSecretaryInfo: string = '';

  private readonly apiUrl = `${this.configService.apiUrl}admin`;
  private readonly token = localStorage.getItem('access_token');
  private readonly headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
    'Content-Type': 'application/json',
  });

  constructor(
    private departmentService: DepartmentService,
    private http: HttpClient, private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.fetchDepartments();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((searchText) => {
      this.page = 1; // Reset to the first page when filtering
      this.fetchDepartments();
    });
  }

  fetchDepartments(): void {
    this.departmentService
      .getDepartments(this.page, this.size, this.search)
      .subscribe({
        next: (response) => {
          this.departments = response.content;
          this.totalDepartments = response.totalElements;
        },
        error: (error) => {
          console.error('Failed to fetch departments:', error);
          alert('Failed to fetch departments. Please try again.');
        },
      });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDepartments();
  }

  onSearchChange(query: string): void {
    this.search = query;
    this.searchSubject.next(query);
  }


  // Delete a department
  deleteDepartment(id: number): void {
    const confirmDelete = confirm('Are you sure you want to delete this department?');
    if (!confirmDelete) {
      return;
    }

    this.departmentService.deleteDepartment(id).subscribe({
      next: (response) => {
        console.log('Department deleted successfully:', response);
        alert('Department deleted successfully!');
        this.fetchDepartments();
      },
      error: (error) => {
        console.error('Failed to delete department:', error);
        alert('Failed to delete department. Please try again.');
      },
    });
  }

  // Open Edit Modal
  openEditModal(department: any): void {
    this.selectedDepartment = { ...department }; // Create a copy of the department
    this.showEditModal = true;
    this.fetchHeads();
    this.fetchSecretaries();
  }

  // Close Edit Modal
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedDepartment = null;
    this.selectedHeadInfo = '';
    this.selectedSecretaryInfo = '';
  }

  // Fetch Heads (Doctors)
  fetchHeads(): void {
    this.isLoadingHeads = true;
    this.http
      .get(`${this.apiUrl}/user/doctorsUpdated?page=1&size=10`, { headers: this.headers })
      .subscribe(
        (response: any) => {
          this.heads = response.content.map((head: any) => ({
            id: head.id,
            displayText: `${head.firstName} ${head.lastName} - ID: ${head.id} - Email: ${head.email}`,
          }));
          this.isLoadingHeads = false;
        },
        (error) => {
          console.error('Error fetching heads:', error);
          this.isLoadingHeads = false;
        }
      );
  }

  // Fetch Secretaries
  fetchSecretaries(): void {
    this.isLoadingSecretaries = true;
    this.http
      .get(`${this.apiUrl}/user/secretariesUpdated?page=1&size=10`, { headers: this.headers })
      .subscribe(
        (response: any) => {
          this.secretaries = response.content.map((secretary: any) => ({
            id: secretary.id,
            displayText: `${secretary.firstName} ${secretary.lastName} - ID: ${secretary.id} - Email: ${secretary.email}`,
          }));
          this.isLoadingSecretaries = false;
        },
        (error) => {
          console.error('Error fetching secretaries:', error);
          this.isLoadingSecretaries = false;
        }
      );
  }

  // Display Selected Head Info
  displaySelectedHeadInfo(headId: string): void {
    const selectedHead = this.heads.find((head) => head.id === +headId);
    if (selectedHead) {
      this.selectedHeadInfo = selectedHead.displayText;
    } else {
      this.selectedHeadInfo = '';
    }
  }

  // Display Selected Secretary Info
  displaySelectedSecretaryInfo(secretaryId: string): void {
    const selectedSecretary = this.secretaries.find((secretary) => secretary.id === +secretaryId);
    if (selectedSecretary) {
      this.selectedSecretaryInfo = selectedSecretary.displayText;
    } else {
      this.selectedSecretaryInfo = '';
    }
  }

  // Update Department
  onUpdateDepartment(): void {
    if (!this.selectedDepartment) {
      return;
    }

    const { id, name, headId, secretaryId } = this.selectedDepartment;
    const data = {
      name,
      headId: { id: headId.id },
      secretaryId: { id: secretaryId.id },
    };

    this.departmentService.updateDepartment(id, data).subscribe({
      next: (response) => {
        console.log('Department updated successfully:', response);
        alert('Department updated successfully!');
        this.closeEditModal();
        this.fetchDepartments();
      },
      error: (error) => {
        console.error('Failed to update department:', error);
        alert('Failed to update department. Please try again.');
      },
    });
  }

  protected readonly Math = Math;
}
