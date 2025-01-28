import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-deleted-users',
  templateUrl: './deleted-users.component.html',
  styleUrls: ['./deleted-users.component.css']
})
export class DeletedUsersComponent implements OnInit {
  users: any[] = [];
  page = 1;
  size = 10;
  search = '';
  role = '';
  totalUsers = 0;

  constructor(private userService: UserService, private http: HttpClient,private configService: ConfigService) {}

  ngOnInit(): void {
    this.fetchDeletedUsers();
  }

  fetchDeletedUsers(): void {
    const url = `${this.configService.apiUrl}admin/user/deleted`;
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      alert('No access token found. Please log in.');
      return;
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });

    const params = new HttpParams()
      .set('page', this.page.toString())
      .set('size', this.size.toString())
      .set('search', this.search)
      .set('role', this.role);

    this.http.get(url, { headers, params }).subscribe({
      next: (response: any) => {
        this.users = response.content; // Assuming the response has a 'content' array
        this.totalUsers = response.totalElements; // Assuming the response has 'totalElements'
      },
      error: (error) => {
        console.error('Failed to fetch deleted users:', error);
        alert('Failed to fetch deleted users. Please try again.');
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDeletedUsers();
  }

  onSearch(): void {
    this.page = 1;
    this.fetchDeletedUsers();
  }

  restoreUser(userId: number): void {
    const confirmRestore = confirm('Are you sure you want to restore this user?');
    if (!confirmRestore) {
      return;
    }

    const url = `${this.configService.apiUrl}admin/user/restore/${userId}`;
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      alert('No access token found. Please log in.');
      return;
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });

    this.http.post(url, null, { headers }).subscribe({
      next: (response) => {
        console.log('User restored successfully:', response);
        alert('User restored successfully!');
        this.fetchDeletedUsers(); // Refresh the list after restoring
      },
      error: (error) => {
        console.error('Failed to restore user:', error);
        alert('Failed to restore user. Please try again.');
      }
    });
  }

  protected readonly Math = Math;
}
