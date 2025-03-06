import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';

@Component({
  selector: 'app-donations',
  templateUrl: './donations.component.html',
  styleUrls: ['./donations.component.css'],
})
export class DonationsComponent implements OnInit {
  donations: any[] = [];
  donorsList: any[] = [];
  selectedDonorIds: number[] = [];
  filteredDonors: any[] = [];

  page = 1;
  size = 10;
  donorSize =4;
  totalPages = 1;
  searchQuery = '';
  bloodType = '';
  quantity: number | null = null;
  donorSearchQuery = '';
  showDonorDropdown = false;

  bloodTypes = [
    'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
    'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'
  ];
  donorPage = 1; // Page for lazy loading donors
  donorTotalPages = 1; // Total pages for donors
  loadingDonors = false; // Prevents duplicate API calls
  constructor(private donorService: DonorService) {}

  ngOnInit(): void {
    this.loadDonations();
    this.loadDonorList();
  }

  // Load Donors for Filter
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
}
