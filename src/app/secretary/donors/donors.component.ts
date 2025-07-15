import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-donors',
  templateUrl: './donors.component.html',
  styleUrls: ['./donors.component.css','./donors-style.css'],
})
export class DonorsComponent implements OnInit {
  donors: any[] = []; // Donors displayed in the table
  donorsList: any[] = []; // Donors for the dropdown
  selectedDonorIds: number[] = []; // Selected donor IDs
  filteredDonors: any[] = []; // Stores filtered donors for the dropdown

  page = 1; // Current page number
  size = 10; // Number of items per page
  donorSize = 5; // Number of items per page for the dropdown
  totalPages = 1; // Total number of pages
  totalElements = 0; // Total number of donors
  searchQuery = ''; // Search text
  bloodType = ''; // Selected blood type filter
  gender = ''; // Selected gender filter
  currentDonorId: number | null = null; // Current donor ID for add/edit operations
  donorSearchQuery = ''; // Query for filtering donors
  currentDonor: any = null; // Stores the current donor for viewing donations

  showEditModal = false; // Flag for edit modal visibility
  showAddDonationModal = false; // Flag for add donation modal visibility
  showDonorDropdown = false; // Dropdown visibility state
  showViewDonationsModal = false; // Flag for donations modal visibility

  editingDonor: any = null; // Donor being edited
  donation: any = { quantity: null, donationDate: null }; // Donation being added

  bloodTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'];
  genders = ['MALE', 'FEMALE'];
  loadingDonors = false; // To prevent multiple simultaneous API calls
  donorPage = 1; // Current page number for the dropdown
  donorTotalPages = 1; // Total number of pages for the dropdown
  viewMode: 'table' | 'card' = 'card'; // Current view mode
  constructor(
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

    this.loadDonors(); // Load donors for the table
    this.loadDonorList(); // Load donors for the dropdown
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
      // On desktop, use saved preference or default to table
      const savedViewMode = localStorage.getItem('donorViewMode') as 'table' | 'card';
      this.viewMode = savedViewMode || 'table';
    }
  }

  // Toggle between table and card view
  toggleView(mode: 'table' | 'card'): void {
    // Only allow toggling on desktop
    if (window.innerWidth > 768) {
      this.viewMode = mode;
      localStorage.setItem('donorViewMode', mode);
    }
  }

  // Fetch donors for the dropdown
  loadDonorList(): void {
    // Prevent multiple calls or loading beyond the total pages
    if (this.loadingDonors || this.donorPage > this.donorTotalPages) return;

    this.loadingDonors = true;

    this.donorService.getDonors(this.donorPage, this.donorSize, '', '', [], '').subscribe(
      (data) => {
        this.donorTotalPages = data.totalPages; // Update the total pages
        this.donorsList = [...this.donorsList, ...data.content]; // Append new donors
        this.filteredDonors = [...this.donorsList]; // Update filtered list
        this.donorPage++; // Increment the page
        this.loadingDonors = false;
      },
      (error) => {
        console.error('Failed to load donors:', error.message);
        this.loadingDonors = false;
      }
    );
  }

  // Filter donors in the dropdown based on search query
  filterDonors(): void {
    if (this.donorSearchQuery.trim()) {
      this.filteredDonors = this.donorsList.filter((donor) =>
        `${donor.id} - ${donor.name}`.toLowerCase().includes(this.donorSearchQuery.toLowerCase())
      );
    } else {
      this.filteredDonors = [...this.donorsList]; // Reset to full list if query is empty
    }
  }

  // Fetch donors for the table
  loadDonors(): void {
    this.donorService.getDonors(this.page, this.size, this.searchQuery, this.bloodType, this.selectedDonorIds, this.gender).subscribe(
      (data) => {
        this.donors = data.content; // Populate table
        this.totalPages = data.totalPages; // Update total pages
        this.totalElements = data.totalElements; // Update total elements
      },
      (error) => {
        console.error('Failed to load donors:', error.message);
      }
    );
  }

  // Trigger donor reload on filter changes
  onSearchChange(): void {
    this.page = 1; // Reset to first page
    this.loadDonors();
  }

  // Open the edit modal
  openEditModal(donor: any): void {
    this.editingDonor = { ...donor }; // Clone donor to prevent direct edits
    this.showEditModal = true;
  }

  // Close the edit modal
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingDonor = null;
  }

  // Update a donor
  updateDonor(): void {
    if (!this.editingDonor) return;

    this.donorService.updateDonor(this.editingDonor.id, this.editingDonor).subscribe(
      () => {
        this.customAlertService.show('Success', 'Donor updated successfully!');
        this.closeEditModal();
        this.loadDonors();

        // Update the donor in the dropdown list
        const index = this.donorsList.findIndex(d => d.id === this.editingDonor.id);
        if (index !== -1) {
          this.donorsList[index] = { ...this.editingDonor };
          this.filteredDonors = [...this.donorsList];
        }
      },
      (error) => {
        console.error('Failed to update donor:', error.message);
        this.customAlertService.show('Error', 'Failed to update donor: ' + error.message);
      }
    );
  }

  // Delete a donor
  deleteDonor(id: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this donor?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.donorService.deleteDonor(id).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Donor deleted successfully!');

          // Remove donor from selected list if present
          this.selectedDonorIds = this.selectedDonorIds.filter(donorId => donorId !== id);

          // Remove donor from dropdown list
          this.donorsList = this.donorsList.filter(donor => donor.id !== id);
          this.filteredDonors = this.filteredDonors.filter(donor => donor.id !== id);

          this.loadDonors();
        },
        error: (error) => {
          console.error('Failed to delete donor:', error.message);
          this.customAlertService.show('Error', 'Failed to delete donor: ' + error.message);
        },
      });
    });
  }

  // Open the add donation modal
  openAddDonationModal(donor: any): void {
    this.currentDonorId = donor.id;
    this.currentDonor = donor;
    this.donation = { quantity: null, donationDate: new Date().toISOString().slice(0, 16) }; // Reset donation form with current date/time
    this.showAddDonationModal = true;
  }

  // Close the add donation modal
  closeAddDonationModal(): void {
    this.showAddDonationModal = false;
    this.currentDonorId = null;
  }

  // Add a new donation
  addDonation(): void {
    if (!this.currentDonorId) {
      this.customAlertService.show('Error', 'No donor selected!');
      return;
    }

    this.donorService.addDonation(this.currentDonorId, this.donation).subscribe(
      (response) => {
        this.customAlertService.show('Success', 'Donation added successfully!');
        this.closeAddDonationModal();

        // Update current donor if donation modal is open
        if (this.showViewDonationsModal && this.currentDonor?.id === this.currentDonorId) {
          if (!this.currentDonor.donations) {
            this.currentDonor.donations = [];
          }
          this.currentDonor.donations.push(response);
        }

        this.loadDonors(); // Reload donors to reflect the new donation
      },
      (error) => {
        console.error('Failed to add donation:', error.message);
        this.customAlertService.show('Error', 'Failed to add donation: ' + error.message);
      }
    );
  }

  // Toggle donor selection in dropdown
  toggleDonorSelection(donorId: number, event: any): void {
    if (event.target.checked) {
      // Add the donor ID to the selected list
      this.selectedDonorIds.push(donorId);
    } else {
      // Remove the donor ID from the selected list
      this.selectedDonorIds = this.selectedDonorIds.filter(id => id !== donorId);
    }
    this.onSearchChange(); // Apply filter when selection changes
  }

  // Hide dropdown after selection
  hideDropdown(event: FocusEvent): void {
    setTimeout(() => {
      this.showDonorDropdown = false;
    }, 200); // Delay to allow checkbox click to register
  }

  // Open the donations modal
  openViewDonationsModal(donor: any): void {
    this.currentDonor = donor; // Set the current donor to show their donations
    this.showViewDonationsModal = true;
  }

  // Close the donations modal
  closeViewDonationsModal(): void {
    this.showViewDonationsModal = false;
    this.currentDonor = null;
  }

  // Load more donors on dropdown scroll
  onDropdownScroll(event: any): void {
    const bottomReached = event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 10;
    if (bottomReached) {
      this.loadDonorList(); // Load the next batch of donors
    }
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
