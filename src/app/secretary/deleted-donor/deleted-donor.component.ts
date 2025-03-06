import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-donor',
  templateUrl: './deleted-donor.component.html',
  styleUrls: ['./deleted-donor.component.css'],
})
export class DeletedDonorComponent implements OnInit {
  deletedDonors: any[] = []; // Deleted donors displayed in the table
  donorsList: any[] = []; // Donors for dropdown
  filteredDonors: any[] = []; // Filtered donors for dropdown
  selectedDonorIds: number[] = []; // Selected donor IDs

  page = 1;
  size = 10;
  totalPages = 1;
  searchQuery = '';
  bloodType = '';
  gender = '';
  donorSearchQuery = ''; // Search query for dropdown filtering

  showDonorDropdown = false; // Dropdown visibility state

  // New pagination variables for donor dropdown
  donorDropdownPage = 1;
  donorDropdownSize = 10;
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
    this.loadDeletedDonors();
    this.loadDonorList(); // Load initial batch of donors for dropdown
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
}
