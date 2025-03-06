import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-donors',
  templateUrl: './donors.component.html',
  styleUrls: ['./donors.component.css'],
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
  constructor(private donorService: DonorService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.loadDonors(); // Load donors for the table
    this.loadDonorList(); // Load donors for the dropdown
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
      },
      (error) => {
        console.error('Failed to update donor:', error.message);
        this.customAlertService.show('Error', 'Failed to update donor: ' + error.message);

      }
    );
  }

  deleteDonor(id: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this donor?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.donorService.deleteDonor(id).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Donor deleted successfully!');
          this.loadDonors()
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
    this.donation = { quantity: null, donationDate: null }; // Reset donation form
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
      () => {
        this.customAlertService.show('Success', 'Donation added successfully!');

        this.closeAddDonationModal();
        this.loadDonors(); // Reload donors to reflect the new donation
      },
      (error) => {
        console.error('Failed to add donation:', error.message);
        this.customAlertService.show('Error', 'Failed to add donation: ' + error.message);

      }
    );
  }


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

  hideDropdown(event: FocusEvent): void {
    setTimeout(() => {
      this.showDonorDropdown = false;
    }, 200); // Delay to allow checkbox click to register
  }
  openViewDonationsModal(donor: any): void {
    this.currentDonor = donor; // Set the current donor to show their donations
    this.showViewDonationsModal = true;
  }

// Close the donations modal
  closeViewDonationsModal(): void {
    this.showViewDonationsModal = false;
    this.currentDonor = null;
  }

  onDropdownScroll(event: any): void {
    const bottomReached = event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 10;
    if (bottomReached) {
      this.loadDonorList(); // Load the next batch of donors
    }
  }

}
