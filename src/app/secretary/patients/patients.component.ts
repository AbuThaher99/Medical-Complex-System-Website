import {Component, OnInit} from '@angular/core';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../services/doctor.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css','./patients-style.css'],
})
export class PatientsComponent implements OnInit {
  patients: any[] = [];
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  page = 1;
  size = 10;
  totalElements = 0;
  searchTerm = '';
  selectedDoctorId: number | null = null;
  private searchSubject = new Subject<string>();
  dropdownOpen = false;
  selectedDoctorIds: number[] = [];
  doctorSearchQuery: string = '';

  showPatientModal = false;
  selectedPatient: any = null;
  doctorsPage: number = 1;
  doctorsSize: number = 10;
  totalDoctorsPages: number = 1;
  loadingDoctors: boolean = false;
  viewMode: 'table' | 'card' = 'table';
  constructor(
    private patientService: PatientService,
    private doctorService: DoctorService,
    private customAlertService: CustomAlertService

  ) {}


  ngOnInit(): void {
    // Check screen size to set appropriate view
    this.checkScreenSize();

    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });

    this.fetchPatients();
    this.loadDoctors();

    // Debounce search input
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.fetchPatients();
      });
  }

  ngOnDestroy(): void {
    // Remove event listener to prevent memory leaks
    window.removeEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  fetchPatients(): void {
    this.patientService
      .getPatientss(this.page, this.size, this.searchTerm, this.selectedDoctorIds)
      .subscribe({
        next: (response) => {
          this.patients = response.content;
          this.totalElements = response.totalElements;
        },
        error: (error) => {
          console.error('Error fetching patients:', error);
        },
      });
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchPatients();
  }

  deletePatient(email: string): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this patient?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.patientService.deletePatient(email).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Patient deleted successfully!');
          this.fetchPatients();
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
          this.customAlertService.show('Error', 'Failed to delete patient.');
        },
      });
    });
  }
  getPatientById(id: number): void {
    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        this.selectedPatient = response;
        this.showPatientModal = true;
      },
      error: (error) => {
        console.error('Error fetching patient details:', error);
      },
    });
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.selectedPatient = null;
  }

  onDoctorCheckboxChange(event: any, doctorId: number): void {
    if (event.target.checked) {
      if (!this.selectedDoctorIds.includes(doctorId)) {
        this.selectedDoctorIds.push(doctorId);
      }
    } else {
      this.selectedDoctorIds = this.selectedDoctorIds.filter(id => id !== doctorId);
    }
    this.fetchPatients();
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  loadDoctors(): void {
    if (this.loadingDoctors || this.doctorsPage > this.totalDoctorsPages) return;

    this.loadingDoctors = true;

    this.doctorService.getDoctors(this.doctorsPage, this.doctorsSize).subscribe({
      next: (response) => {
        this.doctors = [...this.doctors, ...response.content]; // Append new doctors
        this.filteredDoctors = [...this.doctors]; // Initialize filtered list
        this.totalDoctorsPages = response.totalPages;
        this.doctorsPage++; // Prepare for next page load
        this.loadingDoctors = false;
      },
      error: (error) => {
        console.error('Error fetching doctors:', error);
        this.loadingDoctors = false;
      },
    });
  }
  filterDoctors(): void {
    const query = this.doctorSearchQuery.toLowerCase().trim();

    this.filteredDoctors = this.doctors.filter((doctor) => {
      const fullName = `${doctor.user.firstName} ${doctor.user.lastName}`.toLowerCase();
      return fullName.includes(query) || doctor.user.email.toLowerCase().includes(query) || doctor.specialization.toLowerCase().includes(query);
    });
  }


  openDropdown(): void {
    this.dropdownOpen = true;
  }

  // Close Dropdown (Delays to allow selection)
  closeDropdown(): void {
    setTimeout(() => {
      this.dropdownOpen = false;
    }, 200);
  }

  // Lazy Load More Doctors on Scroll
  onDropdownScroll(event: any): void {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      this.loadDoctors();
    }
  }

  toggleView(mode: 'table' | 'card'): void {
    // Only allow toggling on desktop
    if (window.innerWidth > 768) {
      this.viewMode = mode;
      localStorage.setItem('patientViewMode', mode);

      // Force DOM update by applying classes
      setTimeout(() => {
        const tableContainer = document.querySelector('.table-container');
        const cardsContainer = document.querySelector('.cards-container');

        if (tableContainer && cardsContainer) {
          if (mode === 'table') {
            tableContainer.classList.add('active');
            cardsContainer.classList.remove('active');
          } else {
            tableContainer.classList.remove('active');
            cardsContainer.classList.add('active');
          }
        }
      }, 0);
    }
  }
  checkScreenSize(): void {
    if (window.innerWidth <= 768) {
      // On mobile, always use card view
      this.viewMode = 'card';

      // Force cards to show on mobile
      setTimeout(() => {
        const tableContainer = document.querySelector('.table-container');
        const cardsContainer = document.querySelector('.cards-container');

        if (tableContainer) tableContainer.classList.remove('active');
        if (cardsContainer) cardsContainer.classList.add('active');
      }, 0);
    } else {
      // On desktop, use saved preference or default to table
      const savedViewMode = localStorage.getItem('patientViewMode') as 'table' | 'card';
      this.viewMode = savedViewMode || 'table';

      // Apply the correct active class
      setTimeout(() => {
        const tableContainer = document.querySelector('.table-container');
        const cardsContainer = document.querySelector('.cards-container');

        if (tableContainer && cardsContainer) {
          if (this.viewMode === 'table') {
            tableContainer.classList.add('active');
            cardsContainer.classList.remove('active');
          } else {
            tableContainer.classList.remove('active');
            cardsContainer.classList.add('active');
          }
        }
      }, 0);
    }
  }
// Get the initials from first and last name
  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

// Truncate long addresses for better display in the table
  truncateAddress(address: string): string {
    return address.length > 30 ? address.substring(0, 30) + '...' : address;
  }

// Get doctor name from ID
  getDoctorName(id: number): string {
    const doctor = this.doctors.find(doc => doc.id === id);
    if (doctor) {
      return `${doctor.user.firstName} ${doctor.user.lastName}`;
    }
    return `Doctor #${id}`;
  }

// Remove a doctor filter
  removeDoctorFilter(id: number): void {
    this.selectedDoctorIds = this.selectedDoctorIds.filter(docId => docId !== id);
    this.fetchPatients();
  }

  getSpecialtyClass(specialization: string): string {
    const specialty = specialization.toLowerCase();
    if (specialty.includes('neuro')) return 'neurologist';
    if (specialty.includes('ortho')) return 'orthopedist';
    if (specialty.includes('surg')) return 'surgeon';
    if (specialty.includes('cardio')) return 'cardiologist';
    if (specialty.includes('pediatr')) return 'pediatrician';
    if (specialty.includes('derma')) return 'dermatologist';
    return 'default';
  }
  protected readonly Math = Math;
}
