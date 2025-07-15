import { Component, OnInit, HostListener } from '@angular/core';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css','./feedback-style.css']
})
export class FeedbackComponent implements OnInit {
  // Data
  feedbacks: any[] = [];
  originalFeedbacks: any[] = [];

  // Pagination
  page = 1;
  size = 10;
  totalPages = 0;
  totalItems = 0;

  // Filter & Sort
  showFilterDropdown = false;
  showSortDropdown = false;
  selectedRating = 0;
  dateFrom: string | null = null;
  dateTo: string | null = null;
  sortBy = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Stats
  totalFeedbacks = 0;
  averageRating = 0;
  lastWeekFeedbacks = 0;

  // UI States
  isLoading = true;
  viewMode: 'card' | 'table' = 'card'; // Default to card view
  isMobile = false;

  // Sort options
  sortOptions = [
    { label: 'Newest First', value: 'date_desc' },
    { label: 'Oldest First', value: 'date_asc' },
    { label: 'Highest Rating', value: 'rating_desc' },
    { label: 'Lowest Rating', value: 'rating_asc' }
  ];

  // New feedback tracking
  recentFeedbackDate: Date | null = null;

  constructor(private doctorService: DoctorService) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Check screen size on init
    this.checkScreenSize();

    // Load saved view preference from local storage if available
    const savedViewMode = localStorage.getItem('feedbackViewMode') as 'card' | 'table';
    if (savedViewMode && !this.isMobile) {
      this.viewMode = savedViewMode;
    }

    this.loadFeedbacks();
    // Store current time to highlight new feedbacks
    this.recentFeedbackDate = new Date();
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
    localStorage.setItem('feedbackViewMode', mode);
  }

  loadFeedbacks(): void {
    this.isLoading = true;

    // Build query params
    const params: any = {
      page: this.page,
      size: this.size
    };

    // Add filter params
    if (this.selectedRating > 0) {
      params.rating = this.selectedRating;
    }

    if (this.dateFrom) {
      params.dateFrom = this.dateFrom;
    }

    if (this.dateTo) {
      params.dateTo = this.dateTo;
    }

    // Add sort params
    if (this.sortBy) {
      const sortField = this.sortBy.includes('_') ? this.sortBy.split('_')[0] : this.sortBy;
      const sortDir = this.sortBy.includes('_desc') ? 'desc' : 'asc';

      params.sortBy = sortField;
      params.sortDir = sortDir;
    }

    this.doctorService.getFeedbacks(this.page, this.size).subscribe({
      next: (response) => {
        this.feedbacks = response.content;
        this.originalFeedbacks = [...response.content];
        this.totalPages = response.totalPages;
        this.totalItems = response.totalElements;

        // Calculate stats
        this.calculateStats();

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading feedbacks:', error);
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    // Calculate total feedbacks
    this.totalFeedbacks = this.totalItems;

    // Calculate average rating
    if (this.feedbacks.length > 0) {
      const sum = this.feedbacks.reduce((total, feedback) => total + feedback.rating, 0);
      this.averageRating = sum / this.feedbacks.length;
    } else {
      this.averageRating = 0;
    }

    // Calculate feedbacks from last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    this.lastWeekFeedbacks = this.feedbacks.filter(feedback => {
      const feedbackDate = new Date(feedback.createdDate);
      return feedbackDate >= oneWeekAgo;
    }).length;
  }

  // Filter handling
  toggleFilterDropdown(): void {
    this.showFilterDropdown = !this.showFilterDropdown;
    this.showSortDropdown = false;
  }

  toggleSortDropdown(): void {
    this.showSortDropdown = !this.showSortDropdown;
    this.showFilterDropdown = false;
  }

  filterByRating(rating: number): void {
    this.selectedRating = rating;
  }

  applyFilters(): void {
    this.page = 1;
    this.showFilterDropdown = false;
    this.loadFeedbacks();
  }

  resetFilters(): void {
    this.selectedRating = 0;
    this.dateFrom = null;
    this.dateTo = null;
    this.page = 1;
    this.showFilterDropdown = false;
    this.loadFeedbacks();
  }

  hasFilters(): boolean {
    return this.selectedRating > 0 || !!this.dateFrom || !!this.dateTo;
  }

  // Sort handling
  sortFeedback(sortOption: string): void {
    this.sortBy = sortOption;

    // Extract sort direction if present
    if (sortOption.includes('_')) {
      this.sortOrder = sortOption.split('_')[1] as 'asc' | 'desc';
    } else {
      // Toggle sort direction if sorting by the same field
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      this.sortBy = `${sortOption}_${this.sortOrder}`;
    }

    this.showSortDropdown = false;
    this.page = 1;
    this.loadFeedbacks();
  }

  getSortLabel(): string {
    const option = this.sortOptions.find(opt => opt.value === this.sortBy);
    return option ? option.label : 'Newest First';
  }

  // Pagination helpers
  goToPage(pageNum: number): void {
    this.page = pageNum;
    this.loadFeedbacks();
  }

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

  // Helper methods for patient display
  getPatientName(patient: any): string {
    if (!patient) return 'Anonymous';
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Anonymous';
  }

  getPatientInitials(patient: any): string {
    if (!patient) return 'A';

    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';

    if (!firstName && !lastName) return 'A';

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // Highlight new feedbacks
  isNewFeedback(feedback: any): boolean {
    if (!this.recentFeedbackDate || !feedback.createdDate) return false;

    const feedbackDate = new Date(feedback.createdDate);
    return feedbackDate > this.recentFeedbackDate;
  }

  // Math utility for pagination
  protected readonly Math = Math;
}
