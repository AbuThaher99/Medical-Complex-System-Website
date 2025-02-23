import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../services/patient.service';
import { DonorService } from '../../services/donor.service';

@Component({
  selector: 'app-take-blood',
  templateUrl: './take-blood.component.html',
  styleUrls: ['./take-blood.component.css'],
})
export class TakeBloodComponent implements OnInit {
  patients: any[] = [];
  filteredPatients: any[] = [];
  selectedPatientId: number | null = null;
  quantity: number | null = null;
  patientSearchQuery = '';
  showPatientDropdown = false;
  page = 1;
  size = 10;
  totalPages = 1;
  isLoading = false;

  constructor(private patientService: PatientService, private donorService: DonorService) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  // Fetch patients with lazy loading
  loadPatients(): void {
    if (this.isLoading || this.page > this.totalPages) return; // Prevent duplicate requests
    this.isLoading = true;

    this.patientService.getPatients(this.page, this.size).subscribe(
      (data) => {
        this.patients = [...this.patients, ...data.content]; // Append new patients
        this.filteredPatients = [...this.patients]; // Update filtered patients
        this.totalPages = data.totalPages;
        this.page++; // Move to the next page
        this.isLoading = false;
      },
      (error) => {
        console.error('Failed to load patients:', error.message);
        this.isLoading = false;
      }
    );
  }

  // Filter Patients in Dropdown
  filterPatients(): void {
    if (this.patientSearchQuery.trim()) {
      this.filteredPatients = this.patients.filter(patient =>
        `${patient.id} - ${patient.user.firstName} ${patient.user.lastName}`
          .toLowerCase()
          .includes(this.patientSearchQuery.toLowerCase())
      );
    } else {
      this.filteredPatients = [...this.patients];
    }
  }

  // Select Patient
  selectPatient(patientId: number): void {
    this.selectedPatientId = patientId;
    this.showPatientDropdown = false;
  }

  // Take Blood
  takeBlood(): void {
    if (!this.selectedPatientId || !this.quantity || this.quantity < 1) {
      alert('Please select a patient and enter a valid quantity.');
      return;
    }

    const requestBody = {
      patients: { id: this.selectedPatientId },
      quantity: this.quantity,
    };

    this.donorService.takeBlood(requestBody).subscribe(
      () => {
        alert('Blood taken successfully!');
        this.selectedPatientId = null;
        this.quantity = null;
      },
      (error) => {
        console.error('Failed to take blood:', error.message);
        alert('Failed to take blood: ' + error.message);
      }
    );
  }

  // Hide the dropdown with delay to allow click selection
  hideDropdown(): void {
    setTimeout(() => {
      this.showPatientDropdown = false;
    }, 200);
  }

  // Lazy load more patients when scrolled to the bottom
  onDropdownScroll(event: any): void {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      this.loadPatients(); // Load more patients if needed
    }
  }
}
