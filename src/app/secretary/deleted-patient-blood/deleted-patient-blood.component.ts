import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';
import { PatientService } from '../../services/patient.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-patient-blood',
  templateUrl: './deleted-patient-blood.component.html',
  styleUrls: ['./deleted-patient-blood.component.css','./deleted-patient-blooad-style.css'],
})
export class DeletedPatientBloodComponent implements OnInit {
  deletedPatientBlood: any[] = []; // Deleted blood records
  patientsList: any[] = []; // All patients for filtering
  filteredPatients: any[] = []; // Filtered patients
  selectedPatientIds: number[] = []; // Selected patient IDs

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
    private donorService: DonorService,
    private patientService: PatientService,
    private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    // Check screen size to set appropriate view
    this.checkScreenSize();

    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });

    this.loadDeletedPatientBlood();
    this.loadPatientsList(); // Load patients for filtering
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
      const savedViewMode = localStorage.getItem('deletedPatientBloodViewMode') as 'table' | 'card';
      this.viewMode = savedViewMode || 'card';
    }
  }

  // Toggle between table and card view
  toggleView(mode: 'table' | 'card'): void {
    // Only allow toggling on desktop
    if (window.innerWidth > 768) {
      this.viewMode = mode;
      localStorage.setItem('deletedPatientBloodViewMode', mode);
    }
  }

  // Fetch Deleted Patient Blood Records
  loadDeletedPatientBlood(): void {
    this.donorService
      .getDeletedPatientBlood(this.page, this.size, this.searchQuery, this.bloodType, this.selectedPatientIds)
      .subscribe((data) => {
        this.deletedPatientBlood = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements || this.deletedPatientBlood.length;
      });
  }

  // Fetch Patients for Filtering
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
        this.totalPatientsPages = data.totalPages; // Store total pages
        this.patientsPage++; // Move to next page
        this.loadingPatients = false;
      },
      () => {
        this.loadingPatients = false; // Prevent infinite loading if error occurs
      }
    );
  }

  // Filter Patients in the Dropdown
  filterPatients(): void {
    if (this.patientSearchQuery.trim()) {
      this.filteredPatients = this.patientsList.filter((patient) =>
        `${patient.id} - ${patient.user.firstName} ${patient.user.lastName}`
          .toLowerCase()
          .includes(this.patientSearchQuery.toLowerCase())
      );
    } else {
      this.filteredPatients = [...this.patientsList];
    }
  }

  // Apply Filters
  onSearchChange(): void {
    this.page = 1;
    this.loadDeletedPatientBlood();
  }

  // Select/Unselect Patients
  togglePatientSelection(patientId: number, event: any): void {
    if (event.target.checked) {
      this.selectedPatientIds.push(patientId);
    } else {
      this.selectedPatientIds = this.selectedPatientIds.filter((id) => id !== patientId);
    }
    this.onSearchChange();
  }

  // Hide Dropdown
  hideDropdown(): void {
    setTimeout(() => {
      this.showPatientDropdown = false;
    }, 200);
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
    this.loadDeletedPatientBlood();
  }

  restorePatientBlood(id: number): void {
    this.customAlertService.confirm('Confirm Restore', 'Are you sure you want to restore this patient blood record?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.donorService.restorePatientBlood(id).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Patient blood record restored successfully!');
          this.loadDeletedPatientBlood();
        },
        error: (error) => {
          console.error('Failed to restore:', error.message);
          this.customAlertService.show('Error', 'Failed to restore: ' + error.message);
        },
      });
    });
  }

  onDropdownScroll(event: any): void {
    const bottomReached = event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 10;
    if (bottomReached) {
      this.loadPatientsList(); // Load next batch
    }
  }

  protected readonly Math = Math;
}
