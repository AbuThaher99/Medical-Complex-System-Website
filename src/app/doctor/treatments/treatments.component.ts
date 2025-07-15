import {Component, OnInit, OnDestroy, HostBinding, ElementRef} from '@angular/core';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { WarehouseService } from '../../services/warehouse.service';

import { debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PatientMedicineService } from "../../services/patient-medicine.service";
import { CustomAlertService } from "../../services/custom-alert.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-treatments',
  templateUrl: './treatments.component.html',
  styleUrls: ['./treatments.component.css','./treatments-style.css']
})
export class TreatmentsComponent implements OnInit, OnDestroy {
  // Add host bindings for view classes
  @HostBinding('class.grid-view-active') get isGridViewActive() { return this.activeView === 'grid'; }
  @HostBinding('class.table-view-active') get isTableViewActive() { return this.activeView === 'table'; }

  treatments: any[] = [];
  patients: any[] = [];
  filteredPatients: any[] = [];
  selectedPatientIds: number[] = [];
  doctors: any[] = [];
  medicines: any[] = [];
  patientSearchQuery: string = '';

  page = 1;
  size = 10;
  totalTreatments = 0;
  showEditModal = false;
  editingTreatment: any = null;
  showPatientDropdown = false;
  loadingPatients = false;
  loadingDoctors = false;
  showPatientFilterDropdown = false;
  showPatientEditDropdown = false;
  showAddMedicineModal: boolean = false;
  selectedTreatmentId: number | null = null;
  selectedMedicineId: number | null = null;
  medicineQuantity: number = 1;

  currentPatientPage = 1;
  patientPageSize = 10;
  totalPatients = 0;
  loadingMorePatients = false;

  currentDoctorPage = 1;
  doctorPageSize = 10;
  totalDoctors = 0;
  loadingMoreDoctors = false;

  currentEditPatientPage = 1;
  editPatientPageSize = 10;
  totalEditPatients = 0;
  loadingMoreEditPatients = false;

  currentMedicinePage: number = 1;
  medicinePageSize: number = 10;
  totalMedicines: number = 0;
  loadingMoreMedicines: boolean = false;

  showMedicineDropdownModal = false;
  selectedMedicine: any = null;
  selectedMedicineDisplayText = '';

  showDoctorDropdownModal: boolean = false;
  showPatientDropdownModal: boolean = false;

  filteredMedicines: any[] = [];
  medicineSearchQuery: string = '';

  filteredDoctors: any[] = [];
  doctorSearchQuery: string = '';

  filteredEditPatients: any[] = [];
  patientEditSearchQuery: string = '';

  dropdown: any;
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private medicineSearchSubject = new Subject<string>();
  private doctorSearchSubject = new Subject<string>();
  private patientEditSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  isLoading: boolean = false;
  isSearching: boolean = false;
  isEditModalLoading: boolean = false;
  isMedicineModalLoading: boolean = false;
  isSaving: boolean = false;
  isSavingMedicine: boolean = false;

  // View toggle properties
  activeView: 'grid' | 'table' = 'grid';

  constructor(
    private doctorService: DoctorService,
    private patientService: PatientService,
    private warehouseService: WarehouseService,
    private patientMedicineService: PatientMedicineService,
    private customAlertService: CustomAlertService,
    private elementRef: ElementRef ,
    private router: Router,

  ) {}

  ngOnInit(): void {
    this.fetchTreatments();
    this.initViewPreference();
    this.setupSearchObservables();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize view preference from localStorage or based on screen size
   */
  initViewPreference(): void {
    const savedViewPreference = localStorage.getItem('treatments-view-preference') as 'grid' | 'table';

    if (savedViewPreference) {
      this.toggleView(savedViewPreference);
    } else {
      // Default to grid on mobile, table on desktop
      this.toggleView(window.innerWidth < 768 ? 'grid' : 'table');
    }
  }

  /**
   * Toggle between grid and table views
   */
  toggleView(view: 'grid' | 'table'): void {
    console.log(`Toggling view to ${view}`);

    this.activeView = view;
    localStorage.setItem('treatments-view-preference', view);

    const container = document.querySelector('.treatments-container');
    if (container) {
      console.log('Found container, applying classes');
      container.classList.remove('grid-view-active', 'table-view-active');
      container.classList.add(`${view}-view-active`);

      console.log('Container classes after toggle:', container.className);
    } else {
      console.error('Container element not found!');
    }

    // Force classes on the component's host element too
    const hostElement = this.elementRef.nativeElement;
    hostElement.classList.remove('grid-view-active', 'table-view-active');
    hostElement.classList.add(`${view}-view-active`);

    console.log('View toggled, activeView =', this.activeView);
  }

  /**
   * Set up all search-related observables
   */
  setupSearchObservables(): void {
    // Treatment search observable
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isSearching = true;
        this.searchTerm = term;
        this.page = 1; // Reset to first page when searching
        console.log('Searching for:', term);

        return this.doctorService.getTreatments(this.page, this.size, this.selectedPatientIds, this.searchTerm)
          .pipe(finalize(() => this.isSearching = false));
      })
    ).subscribe({
      next: (response) => {
        if (response && response.content) {
          this.treatments = response.content;
          this.totalTreatments = response.totalElements;
          console.log('Search results:', this.treatments.length);
        } else {
          console.warn('Empty or invalid search response:', response);
          this.treatments = [];
          this.totalTreatments = 0;
        }
      },
      error: (error) => {
        console.error('Search error:', error);
        this.customAlertService.show('Error', 'Failed to search treatments');
        this.treatments = [];
      }
    });

    // Medicine search observable
    this.medicineSearchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.medicineSearchQuery = term;
      this.filterMedicines();
    });

    // Doctor search observable
    this.doctorSearchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.doctorSearchQuery = term;
      this.filterDoctors();
    });

    // Patient edit search observable
    this.patientEditSearchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.patientEditSearchQuery = term;
      this.filterEditPatients();
    });
  }

  /**
   * Load medicines for treatment
   */
  loadMedicines(reset: boolean = false): void {
    if (reset) {
      this.medicines = [];
      this.filteredMedicines = [];
      this.currentMedicinePage = 1;
      this.totalMedicines = 0;
      this.medicineSearchQuery = '';
      this.isMedicineModalLoading = true;
    }

    if (this.loadingMoreMedicines ||
      (this.totalMedicines && this.medicines.length >= this.totalMedicines)) {
      return;
    }

    this.loadingMoreMedicines = true;
    this.warehouseService.getAllWarehouseStores(this.currentMedicinePage, this.medicinePageSize)
      .pipe(finalize(() => {
        this.loadingMoreMedicines = false;
        this.isMedicineModalLoading = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.medicines = [...this.medicines, ...response.content];
          this.totalMedicines = response.totalElements;
          this.currentMedicinePage++;
          this.filterMedicines();
        },
        error: (error) => {
          console.error('Error loading medicines:', error);
          this.customAlertService.show('Error', 'Failed to load medicines');
        }
      });
  }

  /**
   * Fetch treatments with current search/filter parameters
   */
  fetchTreatments(): void {
    this.isLoading = true;
    this.doctorService.getTreatments(this.page, this.size, this.selectedPatientIds, this.searchTerm)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response && response.content) {
            this.treatments = response.content;
            this.totalTreatments = response.totalElements;
            console.log('Treatments loaded:', this.treatments.length);
          } else {
            console.warn('Empty or invalid response from getTreatments:', response);
            this.treatments = [];
            this.totalTreatments = 0;
          }
        },
        error: (error) => {
          console.error("Error fetching treatments:", error);
          this.treatments = [];
          this.customAlertService.show('Error', 'Failed to load treatments');
        },
      });
  }

  /**
   * Load patients for filtering
   */
  loadPatientsForFilter(): void {
    this.showPatientFilterDropdown = true;

    if (this.patients.length === 0) {
      this.currentPatientPage = 1;
      this.totalPatients = 0;
      this.fetchPatients();
    } else {
      this.filteredPatients = [...this.patients];
    }
  }

  /**
   * Fetch patients for dropdowns
   */
  fetchPatients(): void {
    if (this.loadingPatients || (this.totalPatients && this.patients.length >= this.totalPatients)) return;

    this.loadingPatients = true;

    this.patientService.getPatients(this.currentPatientPage, this.patientPageSize)
      .pipe(finalize(() => this.loadingPatients = false))
      .subscribe({
        next: (response) => {
          const newPatients = response.content.map((patient: any) => ({
            id: patient.id,
            displayText: `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} - ${patient.user.email}`
          }));

          this.patients = [...this.patients, ...newPatients];
          this.filteredPatients = [...this.patients];
          this.totalPatients = response.totalElements;
          this.currentPatientPage++;
        },
        error: (error) => {
          console.error('Failed to load patients:', error);
          this.customAlertService.show('Error', 'Failed to load patients');
        }
      });
  }

  /**
   * Handle scroll in patient dropdown
   */
  onPatientDropdownScroll(event: Event): void {
    const target = event.target as HTMLElement;

    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchPatients();
    }
  }

  /**
   * Load patients for editing
   */
  loadPatientsForEdit(callback?: () => void): void {
    if (this.loadingMoreEditPatients || (this.totalEditPatients && this.patients.length >= this.totalEditPatients)) return;

    this.loadingMoreEditPatients = true;

    this.patientService.getPatients(this.currentEditPatientPage, this.editPatientPageSize)
      .pipe(finalize(() => {
        this.loadingMoreEditPatients = false;
        if (callback) callback();
      }))
      .subscribe({
        next: (response) => {
          const newPatients = response.content.map((patient: any) => ({
            id: patient.id,
            displayText: `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} - ${patient.user.email}`
          }));

          this.patients = [...this.patients, ...newPatients];
          this.totalEditPatients = response.totalElements;
          this.currentEditPatientPage++;
          this.filterEditPatients();
        },
        error: (error) => {
          console.error('Failed to load patients:', error);
          this.customAlertService.show('Error', 'Failed to load patients');
        }
      });
  }

  /**
   * Handle search input changes
   */
  onSearch(event: any): void {
    const term = event.target.value || '';
    console.log('Search input:', term);
    this.searchSubject.next(term);
  }

  /**
   * Clear search input and results
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');

    const searchInput = document.querySelector('.search-container input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
  }

  /**
   * Change the current page
   */
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchTreatments();
  }

  /**
   * Open edit modal for a treatment
   */
  openEditModal(treatment: any): void {
    this.isEditModalLoading = true;
    this.editingTreatment = { ...treatment };
    this.showEditModal = true;

    if (this.editingTreatment.treatmentDate) {
      const treatmentDate = new Date(this.editingTreatment.treatmentDate);
      this.editingTreatment.treatmentDate = treatmentDate.toISOString().split('T')[0];
    }

    // Reset and reload dropdown lists
    this.patients = [];
    this.doctors = [];
    this.currentEditPatientPage = 1;
    this.currentDoctorPage = 1;

    // Load both data sets concurrently
    let patientsLoaded = false;
    let doctorsLoaded = false;

    // Function to check if loading is complete
    const checkLoadingComplete = () => {
      if (patientsLoaded && doctorsLoaded) {
        this.isEditModalLoading = false;
      }
    };

    this.loadPatientsForEdit(() => {
      const selectedPatient = this.patients.find(p => p.id === this.editingTreatment.patient.id);
      this.editingTreatment.patient = selectedPatient || { id: '', displayText: 'Unknown' };
      patientsLoaded = true;
      checkLoadingComplete();
    });

    this.loadDoctors(() => {
      const selectedDoctor = this.doctors.find(d => d.id === this.editingTreatment.doctor.id);
      this.editingTreatment.doctor = selectedDoctor || { id: '', displayText: 'Unknown' };
      doctorsLoaded = true;
      checkLoadingComplete();
    });

    this.showPatientDropdownModal = false;
    this.showDoctorDropdownModal = false;
  }

  /**
   * Close the edit modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingTreatment = null;
    this.showPatientDropdownModal = false;
    this.showDoctorDropdownModal = false;
    this.showPatientFilterDropdown = false;
    this.patientSearchQuery = '';
    this.filteredPatients = [...this.patients];
    this.patients = [];
  }

  /**
   * Save treatment edits
   */
  saveEdit(): void {
    if (this.editingTreatment) {
      this.isSaving = true;
      this.doctorService.updateTreatment(this.editingTreatment.id, this.editingTreatment)
        .pipe(finalize(() => this.isSaving = false))
        .subscribe({
          next: () => {
            this.customAlertService.show('Success', 'Treatment updated successfully!');
            this.closeEditModal();
            this.fetchTreatments();
          },
          error: (error) => {
            console.error('Update failed:', error);
            this.customAlertService.show('Error', 'Failed to update treatment');
          }
        });
    }
  }

  /**
   * Delete a treatment
   */
  deleteTreatment(id: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this treatment?').then((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isLoading = true;
      this.doctorService.deleteTreatment(id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.customAlertService.show('Success', 'Treatment deleted successfully!');
            this.fetchTreatments();
          },
          error: (error) => {
            console.error('Delete failed:', error);
            this.customAlertService.show('Error', 'Failed to delete treatment.');
          },
        });
    });
  }

  /**
   * Load doctors for dropdowns
   */
  loadDoctors(callback?: () => void): void {
    if (this.loadingMoreDoctors || (this.totalDoctors && this.doctors.length >= this.totalDoctors)) return;

    this.loadingMoreDoctors = true;

    this.doctorService.getDoctors(this.currentDoctorPage, this.doctorPageSize)
      .pipe(finalize(() => {
        this.loadingMoreDoctors = false;
        if (callback) callback();
      }))
      .subscribe({
        next: (response) => {
          const newDoctors = response.content.map((doctor: any) => ({
            id: doctor.id,
            displayText: `${doctor.id} - ${doctor.user.firstName} ${doctor.user.lastName} - ${doctor.user.email}`
          }));

          this.doctors = [...this.doctors, ...newDoctors];
          this.totalDoctors = response.totalElements;
          this.currentDoctorPage++;
          this.filterDoctors();
        },
        error: (error) => {
          console.error('Failed to load doctors:', error);
          this.customAlertService.show('Error', 'Failed to load doctors');
        }
      });
  }

  /**
   * Open add medicine modal
   */
  openAddMedicineModal(treatment: any): void {
    this.selectedTreatmentId = treatment.id;
    this.showAddMedicineModal = true;

    // Reset dropdown state for medicines
    this.showMedicineDropdownModal = false;
    this.selectedMedicine = null;
    this.selectedMedicineDisplayText = '';
    this.medicines = [];
    this.filteredMedicines = [];
    this.currentMedicinePage = 1;
    this.totalMedicines = 0;
    this.medicineSearchQuery = '';

    // Load the first page of medicines
    this.loadMedicines(true);
  }

  /**
   * Close add medicine modal
   */
  closeAddMedicineModal(): void {
    this.showAddMedicineModal = false;
    this.selectedTreatmentId = null;
    this.selectedMedicine = null;
    this.selectedMedicineDisplayText = '';
    this.medicineQuantity = 1;
  }

  /**
   * Save medicine to treatment
   */
  saveMedicine() {
    if (!this.selectedTreatmentId || !this.selectedMedicine || this.medicineQuantity <= 0) {
      this.customAlertService.show('Error', 'Please select a medicine and enter a valid quantity.');
      return;
    }

    this.selectedMedicineId = this.selectedMedicine.medicine.id;
    this.isSavingMedicine = true;

    this.patientMedicineService.addMedicineToTreatment(this.selectedTreatmentId, this.selectedMedicineId, this.medicineQuantity)
      .pipe(finalize(() => this.isSavingMedicine = false))
      .subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Medicine added successfully!');
          this.closeAddMedicineModal();
        },
        error: (error) => {
          console.error('Failed to add medicine:', error);
          this.customAlertService.show('Error', 'Failed to add medicine');
        }
      });
  }

  /**
   * Handle scroll in patient edit dropdown
   */
  onPatientEditDropdownScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.loadPatientsForEdit();
    }
  }

  /**
   * Handle scroll in doctor dropdown
   */
  onDoctorDropdownScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.loadDoctors();
    }
  }

  /**
   * Hide dropdown on blur
   */
  hideDropdown(event: FocusEvent, type: string, section: string): void {
    setTimeout(() => {
      const target = event.relatedTarget as HTMLElement;

      // Check if the new focus is inside a dropdown list
      if (target && target.closest('.dropdown-list')) {
        return;
      }

      if (section === 'modal') {
        if (type === 'doctor') {
          this.showDoctorDropdownModal = false;
        }
        if (type === 'patient') {
          this.showPatientDropdownModal = false;
        }
        if (type === 'medicine') {
          this.showMedicineDropdownModal = false;
        }
      } else if (section === 'filter') {
        if (type === 'patient') {
          this.showPatientFilterDropdown = false;
          this.patientSearchQuery = '';
          this.filteredPatients = [...this.patients];
        }
      }
    }, 200);
  }

  /**
   * Select a doctor in dropdown
   */
  selectDoctor(doctor: any): void {
    this.editingTreatment.doctor = {
      id: doctor.id,
      displayText: doctor.displayText
    };
    this.showDoctorDropdownModal = false;
  }

  /**
   * Select a patient in dropdown
   */
  selectPatient(patient: any, section: string): void {
    if (section === 'modal') {
      this.editingTreatment.patient = { id: patient.id, displayText: patient.displayText };

      // Delay to ensure UI updates properly
      setTimeout(() => {
        this.showPatientDropdownModal = false;
      }, 100);
    }
  }

  /**
   * Filter patients by search term
   */
  filterPatients(): void {
    this.filteredPatients = this.patients.filter(patient =>
      patient.displayText.toLowerCase().includes(this.patientSearchQuery.toLowerCase())
    );
  }

  /**
   * Toggle selection of patient in filter
   */
  toggleSelection(list: number[], id: number, event: any): void {
    if (event.target.checked) {
      if (!list.includes(id)) {
        list.push(id);
      }
    } else {
      const index = list.indexOf(id);
      if (index > -1) {
        list.splice(index, 1);
      }
    }

    // Apply the filter immediately after selection
    this.applyPatientFilter();
  }

  /**
   * Apply patient filter and refresh treatments
   */
  applyPatientFilter(): void {
    this.page = 1; // Reset pagination on filter change
    this.fetchTreatments(); // Fetch treatments based on the selected patients
  }

  /**
   * Handle scroll in medicine dropdown
   */
  onMedicineScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.loadMedicines();
    }
  }

  /**
   * Select a medicine in dropdown
   */
  selectMedicine(medicine: any): void {
    this.selectedMedicine = medicine;
    this.selectedMedicineId = medicine.medicine.id;
    this.selectedMedicineDisplayText = `${medicine.medicine.id} - ${medicine.medicine.name} - ${medicine.medicine.buyPrice}`;
    this.showMedicineDropdownModal = false;
  }

  /**
   * Filter medicines by search term
   */
  filterMedicines(): void {
    const searchTerm = this.medicineSearchQuery.toLowerCase().trim();

    this.filteredMedicines = this.medicines.filter((med) => {
      const medName = med.medicine.name.toLowerCase();
      const medId = String(med.medicine.id).toLowerCase();
      const medPrice = String(med.medicine.buyPrice).toLowerCase();

      return (
        medName.includes(searchTerm) ||
        medId.includes(searchTerm) ||
        medPrice.includes(searchTerm)
      );
    });
  }

  /**
   * Handle medicine search input changes
   */
  onMedicineSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.medicineSearchSubject.next(target.value);
  }

  /**
   * Handle doctor search input changes
   */
  onDoctorSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.doctorSearchSubject.next(target.value);
  }

  /**
   * Handle patient edit search input changes
   */
  onPatientEditSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.patientEditSearchSubject.next(target.value);
  }

  protected readonly Math = Math;

  /**
   * Filter doctors by search term
   */
  private filterDoctors(): void {
    const searchTerm = this.doctorSearchQuery.toLowerCase().trim();

    this.filteredDoctors = this.doctors.filter((doctor) => {
      const doctorName = `${doctor.displayText}`.toLowerCase();
      return doctorName.includes(searchTerm);
    });
  }

  /**
   * Filter edit patients by search term
   */
  private filterEditPatients() {
    const searchTerm = this.patientEditSearchQuery.toLowerCase().trim();

    this.filteredEditPatients = this.patients.filter((patient) => {
      const patientName = `${patient.displayText}`.toLowerCase();
      return patientName.includes(searchTerm);
    });
  }
  private openAddModal() {

  this.router.navigate(['/doctor/add-treatment']);
  }
}
