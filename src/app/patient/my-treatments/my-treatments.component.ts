import { Component, OnInit, HostListener } from '@angular/core';
import { TreatmentPatientService } from '../../services/treatment-patient.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-my-treatments',
  templateUrl: './my-treatments.component.html',
  styleUrls: ['./my-treatments.component.css','./my-treatments-style.css']
})
export class MyTreatmentsComponent implements OnInit {
  // Data
  treatments: any[] = [];
  filteredTreatments: any[] = [];

  // Pagination
  page = 1;
  size = 10;
  totalPages = 0;
  totalItems = 0;

  // Stats
  totalTreatments = 0;
  ratedTreatments = 0;
  recentTreatments = 0;

  // Filter & Search
  searchTerm = '';
  dateFrom: string | null = null;
  dateTo: string | null = null;
  filterStatus: 'all' | 'rated' | 'unrated' = 'all';
  showFilterDropdown = false;

  // Sort
  sortBy: string = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // UI State
  viewMode: 'card' | 'table' = 'card'; // Default to card view
  isMobile = false;
  isLoading = true;
  isSubmitting = false;

  // Feedback Modal
  feedbackModalOpen = false;
  selectedTreatment: any = null;
  feedback = {
    comment: '',
    rating: 0,
    doctorId: 0,
    patientId: 0,
    treatmentId: 0
  };

  constructor(
    private treatmentService: TreatmentPatientService,
    private customAlertService: CustomAlertService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Check screen size for mobile
    this.checkScreenSize();

    // Load saved view preference from local storage if available
    const savedViewMode = localStorage.getItem('treatmentsViewMode') as 'card' | 'table';
    if (savedViewMode && !this.isMobile) {
      this.viewMode = savedViewMode;
    }

    this.loadTreatments();
  }

  // Check screen size to determine if mobile
  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;

    // Force card view on mobile
    if (this.isMobile) {
      this.viewMode = 'card';
    }
  }

  // Set view mode and save preference
  setViewMode(mode: 'card' | 'table'): void {
    this.viewMode = mode;
    localStorage.setItem('treatmentsViewMode', mode);
  }

  loadTreatments(): void {
    this.isLoading = true;

    // Build query params
    const params: any = {
      page: this.page,
      size: this.size
    };

    // Add sort params
    if (this.sortBy) {
      params.sortBy = this.sortBy;
      params.sortDirection = this.sortOrder;
    }

    // Add search params
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    // Add filter params
    if (this.dateFrom) {
      params.dateFrom = this.dateFrom;
    }

    if (this.dateTo) {
      params.dateTo = this.dateTo;
    }

    if (this.filterStatus !== 'all') {
      params.rated = this.filterStatus === 'rated' ? true : false;
    }

    this.treatmentService.getTreatments(this.page, this.size).subscribe({
      next: (response) => {
        this.treatments = response.content;
        this.filteredTreatments = [...this.treatments];
        this.totalPages = response.totalPages;
        this.totalItems = response.totalElements;

        // Calculate stats
        this.calculateStats();

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load treatments:', error);
        this.customAlertService.show('Error', 'Failed to load treatment history. Please try again.');
        this.isLoading = false;
      }
    });
  }

  // Calculate statistics for dashboard
  calculateStats(): void {
    // Total treatments
    this.totalTreatments = this.totalItems;

    // Count rated treatments
    this.ratedTreatments = this.treatments.filter(treatment => treatment.rated).length;

    // Count recent treatments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.recentTreatments = this.treatments.filter(treatment => {
      const treatmentDate = new Date(treatment.treatmentDate);
      return treatmentDate >= thirtyDaysAgo;
    }).length;
  }

  // Filter Dropdown Toggle
  toggleFilterDropdown(): void {
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  // Filter by status
  filterByStatus(status: 'all' | 'rated' | 'unrated'): void {
    this.filterStatus = status;
  }

  // Apply Filters
  applyFilters(): void {
    this.page = 1;
    this.showFilterDropdown = false;
    this.loadTreatments();
  }

  // Reset Filters
  resetFilters(): void {
    this.searchTerm = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.filterStatus = 'all';
    this.page = 1;
    this.showFilterDropdown = false;
    this.loadTreatments();
  }

  // Clear Search
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Check if any filters are applied
  hasFilters(): boolean {
    return (
      this.searchTerm !== '' ||
      this.dateFrom !== null ||
      this.dateTo !== null ||
      this.filterStatus !== 'all'
    );
  }

  // Sort Treatments
  sortTreatments(field: string): void {
    if (this.sortBy === field) {
      // Toggle sort direction if already sorting by this field
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }

    this.loadTreatments();
  }

  // Check if treatment is recent (within last 7 days)
  isRecentTreatment(treatment: any): boolean {
    const treatmentDate = new Date(treatment.treatmentDate);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return treatmentDate >= sevenDaysAgo;
  }

  // Get doctor initials for avatar
  getDoctorInitials(doctor: any): string {
    if (!doctor || !doctor.user) {
      return '';
    }

    const firstName = doctor.user.firstName || '';
    const lastName = doctor.user.lastName || '';

    if (!firstName && !lastName) {
      return '';
    }

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // Pagination
  goToPage(pageNum: number): void {
    this.page = pageNum;
    this.loadTreatments();
  }

  // Get page numbers for pagination display
  getPageNumbers(): number[] {
    const totalVisiblePages = 5;
    const pages: number[] = [];

    if (this.totalPages <= totalVisiblePages) {
      // Show all page numbers
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate middle pages
      let middleStart = Math.max(2, this.page - 1);
      let middleEnd = Math.min(this.totalPages - 1, this.page + 1);

      // Adjust when close to beginning or end
      if (this.page <= 3) {
        middleEnd = 4;
      } else if (this.page >= this.totalPages - 2) {
        middleStart = this.totalPages - 3;
      }

      // Add ellipsis if needed before middle pages
      if (middleStart > 2) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Add middle pages
      for (let i = middleStart; i <= middleEnd; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed after middle pages
      if (middleEnd < this.totalPages - 1) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Always show last page
      pages.push(this.totalPages);
    }

    return pages;
  }

  // Feedback Modal
  openFeedbackModal(treatment: any): void {
    if (treatment.rated) {
      this.customAlertService.show('Info', 'You have already provided feedback for this treatment.');
      return;
    }

    this.selectedTreatment = treatment;
    this.feedback = {
      comment: '',
      rating: 0,
      doctorId: treatment.doctor.id,
      patientId: treatment.patient.id,
      treatmentId: treatment.id
    };

    this.feedbackModalOpen = true;
  }

  closeModal(): void {
    this.feedbackModalOpen = false;
    this.selectedTreatment = null;
    this.feedback = {
      comment: '',
      rating: 0,
      doctorId: 0,
      patientId: 0,
      treatmentId: 0
    };
  }

  // Set Rating
  setRating(rating: number): void {
    this.feedback.rating = rating;
  }

  // Get Rating Text
  getRatingText(): string {
    switch(this.feedback.rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  }

  // Submit Feedback
  submitFeedback(): void {
    if (this.feedback.rating === 0) {
      this.customAlertService.show('Error', 'Please select a rating.');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      comment: this.feedback.comment,
      rating: this.feedback.rating,
      doctor: { id: this.feedback.doctorId },
      patient: { id: this.feedback.patientId },
      treatment: { id: this.feedback.treatmentId }
    };

    this.treatmentService.submitFeedback(payload).subscribe({
      next: () => {
        this.customAlertService.show('Success', 'Your feedback has been submitted successfully!');
        this.isSubmitting = false;
        this.closeModal();
        this.loadTreatments(); // Refresh treatments to reflect feedback status
      },
      error: (error) => {
        console.error('Failed to submit feedback:', error);
        this.customAlertService.show('Error', 'Failed to submit feedback. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  // Navigation helpers
  previousPage(): void {
    if (this.page > 1) {
      this.goToPage(this.page - 1);
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.goToPage(this.page + 1);
    }
  }

  // Math utility for pagination
  protected readonly Math = Math;
}
