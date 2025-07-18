import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-donor',
  templateUrl: './deleted-donor.component.html',
  styleUrls: ['./deleted-donor.component.css','./deleted-donor-style.css'],
})
export class DeletedDonorComponent implements OnInit {
  deletedDonors: any[] = []; // Deleted donors displayed in the table
  donorsList: any[] = []; // Donors for dropdown
  filteredDonors: any[] = []; // Filtered donors for dropdown
  selectedDonorIds: number[] = []; // Selected donor IDs

  page = 1;
  size = 10;
  totalPages = 1;
  totalElements = 0; // Total number of deleted donors
  searchQuery = '';
  bloodType = '';
  gender = '';
  donorSearchQuery = ''; // Search query for dropdown filtering

  showDonorDropdown = false; // Dropdown visibility state
  viewMode: 'table' | 'card' = 'card'; // Default to card view

  // New pagination variables for donor dropdown
  donorDropdownPage = 1;
  donorDropdownSize = 5;
  donorDropdownTotalPages = 1;
  isLoadingDonors = false;

  bloodTypes = [
    'A_POSITIVE',
    'A_NEGATIVE',
    'B_POSITIVE',
    'B_NEGATIVE',
    'O_POSITIVE',
    'O_NEGATIVE',
    'AB_POSITIVE',
    'AB_NEGATIVE',
  ];
  genders = ['MALE', 'FEMALE'];

  constructor(private donorService: DonorService, private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    // Check screen size to set appropriate view
    this.checkScreenSize();

    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });

    this.loadDeletedDonors();
    this.loadDonorList(); // Load initial batch of donors for dropdown
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
      const savedViewMode = localStorage.getItem('deletedDonorViewMode') as 'table' | 'card';
      this.viewMode = savedViewMode || 'card';
    }
  }

  // Toggle between table and card view
  toggleView(mode: 'table' | 'card'): void {
    // Only allow toggling on desktop
    if (window.innerWidth > 768) {
      this.viewMode = mode;
      localStorage.setItem('deletedDonorViewMode', mode);
    }
  }

  loadDonorList(): void {
    // Prevent multiple simultaneous requests
    if (this.isLoadingDonors) {
      return;
    }

    // Don't load more if we've already loaded all pages
    if (this.donorDropdownPage > this.donorDropdownTotalPages && this.donorDropdownTotalPages !== 1) {
      return;
    }

    this.isLoadingDonors = true;

    this.donorService.getDeletedDonors(
      this.donorDropdownPage,
      this.donorDropdownSize,
      this.donorSearchQuery,
      '',
      [],
      ''
    ).subscribe({
      next: (data) => {
        if (this.donorDropdownPage === 1) {
          // First page - initialize the list
          this.donorsList = data.content;
        } else {
          // Append new donors to existing list
          this.donorsList = [...this.donorsList, ...data.content];
        }

        this.donorDropdownTotalPages = data.totalPages;
        this.filteredDonors = [...this.donorsList]; // Update filtered donors
        this.isLoadingDonors = false;

        // Increment page for next load
        this.donorDropdownPage++;
      },
      error: (error) => {
        console.error('Error loading donors:', error);
        this.isLoadingDonors = false;
        this.customAlertService.show('Error', 'Failed to load donors: ' + error.message);
      }
    });
  }

  onDropdownScroll(event: any): void {
    const element = event.target;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollThreshold = element.scrollHeight - 20; // 20px before bottom

    // Load more donors when scrolled near bottom
    if (scrollPosition >= scrollThreshold && !this.isLoadingDonors) {
      this.loadDonorList();
    }
  }

  filterDonors(): void {
    // Reset pagination when filtering
    this.donorDropdownPage = 1;

    if (this.donorSearchQuery.trim()) {
      // Filter locally first
      this.filteredDonors = this.donorsList.filter((donor) =>
        `${donor.id} - ${donor.name}`.toLowerCase().includes(this.donorSearchQuery.toLowerCase())
      );

      // If we have few results, fetch from server with search term
      if (this.filteredDonors.length < 5) {
        this.loadDonorList();
      }
    } else {
      this.filteredDonors = [...this.donorsList]; // Reset to full list if query is empty
    }
  }

  loadDeletedDonors(): void {
    this.donorService
      .getDeletedDonors(
        this.page,
        this.size,
        this.searchQuery,
        this.bloodType,
        this.selectedDonorIds,
        this.gender
      )
      .subscribe((data) => {
        this.deletedDonors = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements || data.content.length;
      });
  }

  onSearchChange(): void {
    this.page = 1; // Reset to first page
    this.loadDeletedDonors();
  }

  toggleDonorSelection(donorId: number, event: any): void {
    if (event.target.checked) {
      this.selectedDonorIds.push(donorId);
    } else {
      this.selectedDonorIds = this.selectedDonorIds.filter((id) => id !== donorId);
    }
    this.onSearchChange();
  }

  hideDropdown(event: FocusEvent): void {
    setTimeout(() => {
      this.showDonorDropdown = false;
    }, 200); // Delay to allow checkbox clicks to register
  }

  // Reset donor dropdown when opening
  openDonorDropdown(): void {
    this.showDonorDropdown = true;
    // If we have very few items loaded, load the first page again
    if (this.donorsList.length < this.donorDropdownSize) {
      this.donorDropdownPage = 1;
      this.loadDonorList();
    }
  }

  restoreDonor(donorId: number): void {
    this.customAlertService.confirm('Confirm Restore', 'Are you sure you want to restore this donor?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.donorService.restoreDonor(donorId).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Donor restored successfully!');
          this.loadDeletedDonors();

          // Remove restored donor from selected IDs
          this.selectedDonorIds = this.selectedDonorIds.filter(id => id !== donorId);

          // Refresh donor dropdown list as well
          this.donorDropdownPage = 1;
          this.donorsList = [];
          this.loadDonorList();
        },
        error: (error) => {
          console.error('Failed to restore donor:', error.message);
          this.customAlertService.show('Error', 'Failed to restore donor: ' + error.message);
        },
      });
    });
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

  protected readonly Math = Math;
}
