import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../services/patient.service';
import { DonorService } from '../../services/donor.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-patient-blood',
  templateUrl: './patient-blood.component.html',
  styleUrls: ['./patient-blood.component.css','./patient-blood-style.css'],
})
export class PatientBloodComponent implements OnInit {
  patientBloodRecords: any[] = [];
  patientsList: any[] = [];
  selectedPatientIds: number[] = [];
  filteredPatients: any[] = [];

  page = 1;
  size = 10;
  totalPages = 1;
  totalElements = 0;
  searchQuery = '';
  bloodType = '';
  patientSearchQuery = '';
  patientsPage = 1;
  patientsSize = 10; // Load only 10 patients at a time
  totalPatientsPages = 1;
  loadingPatients = false; // Prevent multiple calls
  viewMode: 'table' | 'card' = 'card'; // Default to card view

  showPatientDropdown = false;

  bloodTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'];

  constructor(
    private patientService: PatientService,
    private donorService: DonorService,
    private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    // Check screen size to set appropriate view
    this.checkScreenSize();

    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });

    this.loadPatientBlood();
    this.loadPatientsList();
  }

  ngOnDestroy(): void {
    // Remove event listener to prevent memory leaks
    window.removeEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  // Check screen size and set view mode accordingly
  checkScreenSize(): void {
    if (window.innerWidth <= 768) {
      // On mobile, always use card view
      this.viewMode = 'card';
    } else {
      // On desktop, use saved preference or default to card
      const savedViewMode = localStorage.getItem('patientBloodViewMode') as 'table' | 'card';
      this.viewMode = savedViewMode || 'card';
    }
  }

  // Toggle between table and card view
  toggleView(mode: 'table' | 'card'): void {
    // Only allow toggling on desktop
    if (window.innerWidth > 768) {
      this.viewMode = mode;
      localStorage.setItem('patientBloodViewMode', mode);
    }
  }

  // Fetch patients for the dropdown
  loadPatientsList(): void {
    if (this.loadingPatients || this.patientsPage > this.totalPatientsPages) return;

    this.loadingPatients = true;

    this.patientService.getPatients(this.patientsPage, this.patientsSize).subscribe(
      (data) => {
        if (this.patientsPage === 1) {
          this.patientsList = data.content; // First load
        } else {
          this.patientsList = [...this.patientsList, ...data.content]; // Append new data
        }

        this.filteredPatients = [...this.patientsList]; // Update filtered list
        this.totalPatientsPages = data.totalPages;
        this.patientsPage++;
        this.loadingPatients = false;
      },
      (error) => {
        console.error('Failed to load patients:', error.message);
        this.loadingPatients = false;
      }
    );
  }

  // Filter Patients in Dropdown
  filterPatients(): void {
    if (this.patientSearchQuery.trim()) {
      this.filteredPatients = this.patientsList.filter((patient) => {
        const searchString = `${patient.id} - ${patient.user.firstName} ${patient.user.lastName}`.toLowerCase();
        return searchString.includes(this.patientSearchQuery.toLowerCase());
      });
    } else {
      this.filteredPatients = [...this.patientsList];
    }
  }

  // Fetch patient blood records
  loadPatientBlood(): void {
    this.donorService.getPatientBlood(this.page, this.size, this.searchQuery, this.bloodType, this.selectedPatientIds).subscribe(
      (data) => {
        this.patientBloodRecords = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements || this.patientBloodRecords.length;
      },
      (error) => {
        console.error('Failed to load patient blood records:', error.message);
      }
    );
  }

  // Handle search and filter changes
  onSearchChange(): void {
    this.page = 1; // Reset to first page
    this.loadPatientBlood();
  }

  // Toggle Patient Selection in filter
  togglePatientSelection(patientId: number, event: any): void {
    if (event.target.checked) {
      this.selectedPatientIds.push(patientId);
    } else {
      this.selectedPatientIds = this.selectedPatientIds.filter((id) => id !== patientId);
    }
    this.onSearchChange();
  }

  // Hide the dropdown with delay
  hideDropdown(): void {
    setTimeout(() => {
      this.showPatientDropdown = false;
    }, 200); // Delay to allow checkbox click to register
  }

  // Delete a patient blood record
  deletePatientBlood(recordId: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this blood record?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.donorService.deletePatientBlood(recordId).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Blood record deleted successfully!');
          this.loadPatientBlood(); // Reload records
        },
        error: (error) => {
          console.error('Failed to delete blood record:', error.message);
          this.customAlertService.show('Error', 'Failed to delete blood record: ' + error.message);
        },
      });
    });
  }

  // Load more patients on dropdown scroll
  onDropdownScroll(event: any): void {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      this.loadPatientsList();
    }
  }

  // Get patient name from ID
  getPatientName(id: number): string {
    const patient = this.patientsList.find(patient => patient.id === id);
    if (patient) {
      return `${patient.user.firstName} ${patient.user.lastName}`;
    }
    return `Patient #${id}`;
  }

  // Remove a patient filter
  removePatientFilter(id: number): void {
    this.selectedPatientIds = this.selectedPatientIds.filter(patientId => patientId !== id);
    this.onSearchChange();
  }

  // Get patient initials
  getPatientInitials(patient: any): string {
    if (!patient || !patient.user) return '';

    const firstName = patient.user.firstName || '';
    const lastName = patient.user.lastName || '';

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // Get blood type CSS class
  getBloodTypeClass(bloodType: string): string {
    if (!bloodType) return 'default';

    return this.bloodTypes.includes(bloodType) ? bloodType : 'default';
  }

  // Check if any filters are active
  hasActiveFilters(): boolean {
    return this.searchQuery !== '' ||
      this.bloodType !== '' ||
      this.selectedPatientIds.length > 0;
  }

  // Reset all filters
  resetFilters(): void {
    this.searchQuery = '';
    this.bloodType = '';
    this.selectedPatientIds = [];
    this.page = 1;
    this.loadPatientBlood();
  }

  protected readonly Math = Math;
}
