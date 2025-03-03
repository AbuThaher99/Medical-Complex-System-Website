import { Component, OnInit } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfigService } from '../../services/config.service';


import {Subject} from "rxjs";
import {CustomAlertService} from "../../services/custom-alert.service";

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


  showEditModal = false;
  selectedDepartment: any = null;
  private searchSubject = new Subject<string>();


  heads: any[] = [];
  secretaries: any[] = [];
  isLoadingHeads = false;
  isLoadingSecretaries = false;
  selectedHeadInfo: string = '';
  selectedSecretaryInfo: string = '';


  headPage = 1;
  headSize = 10;
  totalHeads = 0;
  headSearchTerm = '';
  filteredHeads: any[] = [];

  secretaryPage = 1;
  secretarySize = 10;
  totalSecretaries = 0;
  secretarySearchTerm = '';
  filteredSecretaries: any[] = [];
  showHeadDropdown = false;
  showSecretaryDropdown = false;
  private readonly apiUrl = `${this.configService.apiUrl}admin`;
  private readonly token = localStorage.getItem('access_token');
  private readonly headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
    'Content-Type': 'application/json',
  });

  constructor(
    private departmentService: DepartmentService,
    private http: HttpClient, private configService: ConfigService,
    private customAlertService: CustomAlertService

  ) {}

  ngOnInit(): void {
    this.fetchDepartments();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((searchText) => {
      this.page = 1;
      this.fetchDepartments();
    });
  }
  toggleHeadDropdown(): void {
    this.showHeadDropdown = !this.showHeadDropdown;
  }
  toggleSecretaryDropdown(): void {
    this.showSecretaryDropdown = !this.showSecretaryDropdown;
  }
  hideDropdown(event: FocusEvent, type: 'head' | 'secretary'): void {
    setTimeout(() => {
      if (type === 'head') {
        this.showHeadDropdown = false;
      } else if (type === 'secretary') {
        this.showSecretaryDropdown = false;
      }
    }, 200);
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
          this.customAlertService.show('Error', 'Failed to fetch departments. Please try again.');

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


  deleteDepartment(id: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this department?').then((confirmed) => {
      if (!confirmed) {
      return;
    }

    this.departmentService.deleteDepartment(id).subscribe({
      next: (response) => {
        console.log('Department deleted successfully:', response);
        this.customAlertService.show('Success', 'Department deleted successfully!');

        this.fetchDepartments();
      },
      error: (error) => {
        console.error('Failed to delete department:', error);
        this.customAlertService.show('Error', 'Failed to delete department. Please try again.');

      },

    });
    });
  }

  openEditModal(department: any): void {
    this.selectedDepartment = { ...department };
    this.showEditModal = true;

    // Reset heads and secretaries data
    this.heads = [];
    this.secretaries = [];

    // Reset pagination counters
    this.headPage = 1;
    this.secretaryPage = 1;
    this.totalHeads = 0;
    this.totalSecretaries = 0;

    // Reset search terms
    this.headSearchTerm = '';
    this.secretarySearchTerm = '';

    // Clear previously selected info
    this.selectedHeadInfo = '';
    this.selectedSecretaryInfo = '';

    // Fetch initial data
    this.fetchHeads();
    this.fetchSecretaries();

    // Set pre-filled values for editing
    setTimeout(() => {
      if (department.headId) {
        this.displaySelectedHeadInfo(department.headId.id);
      } else {
        this.selectedHeadInfo = 'No Head Assigned';
      }

      if (department.secretaryId) {
        this.displaySelectedSecretaryInfo(department.secretaryId.id);
      } else {
        this.selectedSecretaryInfo = 'No Secretary Assigned';
      }
    }, 200);
  }



  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedDepartment = null;
    this.selectedHeadInfo = '';
    this.selectedSecretaryInfo = '';
  }

  fetchHeads(): void {
    if (this.isLoadingHeads || (this.totalHeads && this.heads.length >= this.totalHeads)) return;

    this.isLoadingHeads = true;
    this.http
      .get(`${this.apiUrl}/user/doctorsUpdated?page=${this.headPage}&size=${this.headSize}&search=${this.headSearchTerm}`, { headers: this.headers })
      .subscribe(
        (response: any) => {
          const newHeads = response.content.map((head: any) => ({
            id: head.id,
            displayText: `${head.firstName} ${head.lastName} - ID: ${head.id} - Email: ${head.email}`
          }));

          this.heads = [...this.heads, ...newHeads];
          this.filteredHeads = this.heads;
          this.totalHeads = response.totalElements;
          this.headPage++;
          this.isLoadingHeads = false;
        },
        (error) => {
          console.error('Error fetching heads:', error);
          this.isLoadingHeads = false;
        }
      );
  }

  onHeadScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchHeads();
    }
  }


  selectHead(head: any): void {
    this.selectedDepartment.headId = { id: head.id };
    this.selectedHeadInfo = head.displayText;
    this.showHeadDropdown = false;
  }

  fetchSecretaries(): void {
    if (this.isLoadingSecretaries || (this.totalSecretaries && this.secretaries.length >= this.totalSecretaries)) return;

    this.isLoadingSecretaries = true;
    this.http
      .get(`${this.apiUrl}/user/secretariesUpdated?page=${this.secretaryPage}&size=${this.secretarySize}&search=${this.secretarySearchTerm}`, { headers: this.headers })
      .subscribe(
        (response: any) => {
          const newSecretaries = response.content.map((secretary: any) => ({
            id: secretary.id,
            displayText: `${secretary.firstName} ${secretary.lastName} - ID: ${secretary.id} - Email: ${secretary.email}`
          }));

          this.secretaries = [...this.secretaries, ...newSecretaries];
          this.filteredSecretaries = this.secretaries;
          this.totalSecretaries = response.totalElements;
          this.secretaryPage++;
          this.isLoadingSecretaries = false;
        },
        (error) => {
          console.error('Error fetching secretaries:', error);
          this.isLoadingSecretaries = false;
        }
      );
  }

  onSecretaryScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchSecretaries();
    }
  }



  selectSecretary(secretary: any): void {
    this.selectedDepartment.secretaryId = { id: secretary.id };
    this.selectedSecretaryInfo = secretary.displayText;
    this.showSecretaryDropdown = false;
  }
  displaySelectedHeadInfo(headId: string): void {
    const selectedHead = this.heads.find((head) => head.id === +headId);
    if (selectedHead) {
      this.selectedHeadInfo = selectedHead.displayText;
    } else {
      this.selectedHeadInfo = '';
    }
  }

  displaySelectedSecretaryInfo(secretaryId: string): void {
    const selectedSecretary = this.secretaries.find((secretary) => secretary.id === +secretaryId);
    if (selectedSecretary) {
      this.selectedSecretaryInfo = selectedSecretary.displayText;
    } else {
      this.selectedSecretaryInfo = '';
    }
  }

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
        this.customAlertService.show('Success', 'Department updated successfully!');

        this.closeEditModal();
        this.fetchDepartments();
      },
      error: (error) => {
        console.error('Failed to update department:', error);
        this.customAlertService.show('Error', 'Failed to update department. Please try again.');

      },
    });
  }
  filterHeads(searchTerm: string): void {
    this.headSearchTerm = searchTerm;
    this.filteredHeads = this.heads.filter((head) =>
      head.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  filterSecretaries(searchTerm: string): void {
    this.secretarySearchTerm = searchTerm;
    this.filteredSecretaries = this.secretaries.filter((secretary) =>
      secretary.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  protected readonly Math = Math;
}
