import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';

@Component({
  selector: 'app-donations',
  templateUrl: './donations.component.html',
  styleUrls: ['./donations.component.css','./donations-style.css'],
})
export class DonationsComponent implements OnInit {
  donations: any[] = [];
  donorsList: any[] = [];
  selectedDonorIds: number[] = [];
  filteredDonors: any[] = [];

  page = 1;
  size = 10;
  donorSize = 5;
  totalPages = 1;
  totalElements = 0; // Total number of donations
  searchQuery = '';
  bloodType = '';
  quantity: number | null = null;
  donorSearchQuery = '';
  showDonorDropdown = false;
  viewMode: 'table' | 'card' = 'card'; // Setting default to card view

  bloodTypes = [
    'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
    'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'
  ];
  donorPage = 1; // Page for lazy loading donors
  donorTotalPages = 1; // Total pages for donors
  loadingDonors = false; // Prevents duplicate API calls

  constructor(private donorService: DonorService) {}

  ngOnInit(): void {
    // Check screen size to set appropriate view
    this.checkScreenSize();

    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });

    this.loadDonations();
    this.loadDonorList();
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
      const savedViewMode = localStorage.getItem('donationsViewMode') as 'table' | 'card';
      this.viewMode = savedViewMode || 'card';
    }
  }

  // Toggle between table and card view
  toggleView(mode: 'table' | 'card'): void {
    // Only allow toggling on desktop
    if (window.innerWidth > 768) {
      this.viewMode = mode;
      localStorage.setItem('donationsViewMode', mode);
    }
  }

  // Load Donors with Lazy Loading
  loadDonorList(): void {
    if (this.loadingDonors || this.donorPage > this.donorTotalPages) return;

    this.loadingDonors = true;

    this.donorService.getDonors(this.donorPage, this.donorSize, '', '', [], '').subscribe(
      (data) => {
        this.donorTotalPages = data.totalPages;
        this.donorsList = [...this.donorsList, ...data.content];
        this.filteredDonors = [...this.donorsList];
        this.donorPage++;
        this.loadingDonors = false;
      },
      (error) => {
        console.error('Failed to load donors:', error.message);
        this.loadingDonors = false;
      }
    );
  }

  onDropdownScroll(event: any): void {
    const bottomReached = event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 10;
    if (bottomReached) {
      this.loadDonorList();
    }
  }

  // Load Donations
  loadDonations(): void {
    this.donorService.getDonations(this.page, this.size, this.searchQuery, this.bloodType, this.selectedDonorIds, this.quantity)
      .subscribe(data => {
        this.donations = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements || this.donations.length;
      });
  }

  // Apply Filters
  onSearchChange(): void {
    this.page = 1;
    this.loadDonations();
  }

  // Filter Donors in Dropdown
  filterDonors(): void {
    if (this.donorSearchQuery.trim()) {
      this.filteredDonors = this.donorsList.filter(donor =>
        `${donor.id} - ${donor.name}`.toLowerCase().includes(this.donorSearchQuery.toLowerCase())
      );
    } else {
      this.filteredDonors = [...this.donorsList];
    }
  }

  // Select/Unselect Donors
  toggleDonorSelection(donorId: number, event: any): void {
    if (event.target.checked) {
      this.selectedDonorIds.push(donorId);
    } else {
      this.selectedDonorIds = this.selectedDonorIds.filter(id => id !== donorId);
    }
    this.onSearchChange();
  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showDonorDropdown = false;
    }, 200);
  }

  // Get donor name from ID
  getDonorName(id: number): string {
    const donor = this.donorsList.find(donor => donor.id === id);
    if (donor) {
      return donor.name;
    }
    return `Donor #${id}`;
  }

  // Remove a donor filter
  removeDonorFilter(id: number): void {
    this.selectedDonorIds = this.selectedDonorIds.filter(donorId => donorId !== id);
    this.onSearchChange();
  }

  // Get initials from name
  getInitials(name: string): string {
    if (!name) return '';

    const parts = name.split(' ');
    if (parts.length === 1) {
      return name.charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
      this.quantity !== null ||
      this.selectedDonorIds.length > 0;
  }

  // Reset all filters
  resetFilters(): void {
    this.searchQuery = '';
    this.bloodType = '';
    this.quantity = null;
    this.selectedDonorIds = [];
    this.page = 1;
    this.loadDonations();
  }

  protected readonly Math = Math;
}
