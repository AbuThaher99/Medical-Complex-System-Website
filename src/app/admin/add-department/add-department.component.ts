import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigService } from '../../services/config.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-add-department',
  templateUrl: './add-department.component.html',
  styleUrls: ['./add-department.component.css'],
})
export class AddDepartmentComponent implements OnInit {
  addDepartmentForm: FormGroup;

  heads: any[] = [];
  secretaries: any[] = [];

  headPage = 1;
  headSize = 5;
  totalHeads = 0;
  headSearchTerm = '';
  filteredHeads: any[] = [];

  secretaryPage = 1;
  secretarySize = 5;
  totalSecretaries = 0;
  secretarySearchTerm = '';
  filteredSecretaries: any[] = [];


  isLoadingHeads = false;
  isLoadingSecretaries = false;


  selectedHeadInfo: string = '';
  selectedSecretaryInfo: string = '';
  showHeadDropdown = false;
  showSecretaryDropdown = false;

  private readonly apiUrl = `${this.configService.apiUrl}admin`;
  private readonly token = localStorage.getItem('access_token');
  private readonly headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
    'Content-Type': 'application/json',
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private configService: ConfigService,
    private customAlertService: CustomAlertService
  ) {
    this.addDepartmentForm = this.fb.group({
      name: ['', Validators.required],
      headId: ['', Validators.required],
      secretaryId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fetchHeads();
    this.fetchSecretaries();
  }


  toggleHeadDropdown(): void {
    this.showHeadDropdown = !this.showHeadDropdown;
    if (this.showHeadDropdown) {
      this.showSecretaryDropdown = false;
    }
  }

  toggleSecretaryDropdown(): void {
    this.showSecretaryDropdown = !this.showSecretaryDropdown;
    if (this.showSecretaryDropdown) {
      this.showHeadDropdown = false;
    }
  }

  hideDropdown(type: 'head' | 'secretary'): void {
    setTimeout(() => {
      if (type === 'head') {
        this.showHeadDropdown = false;
      } else if (type === 'secretary') {
        this.showSecretaryDropdown = false;
      }
    }, 350);
  }


  
  fetchHeads(reset: boolean = false): void {
    if (this.isLoadingHeads || (this.totalHeads && this.heads.length >= this.totalHeads && !reset)) return;

    if (reset) {
      this.headPage = 1;
      this.heads = [];
      this.filteredHeads = [];
      this.totalHeads = 0;
    }

    this.isLoadingHeads = true;
    this.http
      .get(`${this.apiUrl}/user/doctors?page=${this.headPage}&size=${this.headSize}&search=${this.headSearchTerm}`, {
        headers: this.headers,
      })
      .subscribe(
        (response: any) => {
          const newHeads = response.content.map((head: any) => ({
            id: head.id,
            displayText: `${head.firstName} ${head.lastName} - ID: ${head.id} - Email: ${head.email}`,
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
          this.customAlertService.show('Error', 'Failed to fetch doctors. Please try again.');
        }
      );
  }


  onHeadScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
      this.fetchHeads();
    }
  }


  filterHeads(searchTerm: string): void {
    this.headSearchTerm = searchTerm;
    if (searchTerm) {
      this.filteredHeads = this.heads.filter(head =>
        head.displayText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      this.filteredHeads = this.heads;
    }
  }

  selectHead(head: any): void {
    this.addDepartmentForm.patchValue({ headId: head.id });
    this.selectedHeadInfo = head.displayText;
    this.showHeadDropdown = false;
  }


  fetchSecretaries(reset: boolean = false): void {
    if (this.isLoadingSecretaries || (this.totalSecretaries && this.secretaries.length >= this.totalSecretaries && !reset)) return;

    if (reset) {
      this.secretaryPage = 1;
      this.secretaries = [];
      this.filteredSecretaries = [];
      this.totalSecretaries = 0;
    }

    this.isLoadingSecretaries = true;
    this.http
      .get(`${this.apiUrl}/user/secretaries?page=${this.secretaryPage}&size=${this.secretarySize}&search=${this.secretarySearchTerm}`, {
        headers: this.headers,
      })
      .subscribe(
        (response: any) => {
          const newSecretaries = response.content.map((secretary: any) => ({
            id: secretary.id,
            displayText: `${secretary.firstName} ${secretary.lastName} - ID: ${secretary.id} - Email: ${secretary.email}`,
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
          this.customAlertService.show('Error', 'Failed to fetch secretaries. Please try again.');
        }
      );
  }


  onSecretaryScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
      this.fetchSecretaries();
    }
  }


  filterSecretaries(searchTerm: string): void {
    this.secretarySearchTerm = searchTerm;
    if (searchTerm) {
      this.filteredSecretaries = this.secretaries.filter(secretary =>
        secretary.displayText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      this.filteredSecretaries = this.secretaries;
    }
  }

  selectSecretary(secretary: any): void {
    this.addDepartmentForm.patchValue({ secretaryId: secretary.id });
    this.selectedSecretaryInfo = secretary.displayText;
    this.showSecretaryDropdown = false;
  }


  onSubmit(): void {
    if (this.addDepartmentForm.valid) {
      const departmentData = {
        name: this.addDepartmentForm.value.name,
        headId: { id: this.addDepartmentForm.value.headId },
        secretaryId: { id: this.addDepartmentForm.value.secretaryId },
      };

      this.http
        .post(`${this.apiUrl}/departments/`, departmentData, {
          headers: this.headers,
        })
        .subscribe(
          () => {
            this.customAlertService.show('Success', 'Department added successfully!');
            this.addDepartmentForm.reset();
            this.selectedHeadInfo = '';
            this.selectedSecretaryInfo = '';
            this.heads = [];
            this.secretaries = [];
            this.headPage = 1;
            this.secretaryPage = 1;
            this.fetchHeads();
            this.fetchSecretaries();
          },
          (error) => {
            console.error('Error adding department:', error);
            this.customAlertService.show('Error', 'Failed to add department. Please try again.');
          }
        );
    }
  }
}
