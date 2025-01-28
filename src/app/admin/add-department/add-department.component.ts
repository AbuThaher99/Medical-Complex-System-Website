import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-add-department',
  templateUrl: './add-department.component.html',
  styleUrls: ['./add-department.component.css'],
})
export class AddDepartmentComponent implements OnInit {
  addDepartmentForm: FormGroup;
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

  constructor(private fb: FormBuilder, private http: HttpClient, private configService: ConfigService) {
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

  fetchHeads(): void {
    this.isLoadingHeads = true;
    this.http
      .get(`${this.apiUrl}/user/doctors?page=1&size=10`, { headers: this.headers })
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

  fetchSecretaries(): void {
    this.isLoadingSecretaries = true;
    this.http
      .get(`${this.apiUrl}/user/secretaries?page=1&size=10`, { headers: this.headers })
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
            alert('Department added successfully!');
            this.addDepartmentForm.reset();
            this.selectedHeadInfo = '';
            this.selectedSecretaryInfo = '';
            this.fetchHeads();
            this.fetchSecretaries();
          },
          (error) => {
            console.error('Error adding department:', error);
            alert('Failed to add department.');
          }
        );
    }
  }
}
