import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { ConfigService } from '../../services/config.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-users',
  templateUrl: './deleted-users.component.html',
  styleUrls: ['./deleted-users.component.css']
})
export class DeletedUsersComponent implements OnInit {
  users: any[] = [];
  page = 1;
  size = 2;
  search = '';
  role = '';
  totalUsers = 0;
  isLoading = false;
  isRestoring = false;
  constructor(private userService: UserService, private http: HttpClient, private configService: ConfigService,private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    this.fetchDeletedUsers();
  }

  fetchDeletedUsers(): void {
    const url = `${this.configService.apiUrl}admin/user/deleted`;
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      this.customAlertService.show('Error', 'No access token found. Please log in.');

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
        this.users = response.content;
        this.totalUsers = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to fetch deleted users:', error);
        this.customAlertService.show('Error', 'Failed to fetch deleted users. Please try again.');
        this.isLoading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDeletedUsers();
  }

  async restoreUser(userId: number): Promise<void> {
    try {
      const confirmed = await this.customAlertService.confirm(
        'Confirm Restore',
        'Are you sure you want to restore this user?'
      );

      if (!confirmed) {
        return;
      }

      this.isRestoring = true;
      const url = `${this.configService.apiUrl}admin/user/restore/${userId}`;
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        this.customAlertService.show('Error', 'No access token found. Please log in.');
        this.isRestoring = false;
        return;
      }

      const headers = new HttpHeaders({
        'accept': '*/*',
        'Authorization': `Bearer ${accessToken}`
      });

      await this.http.post(url, null, { headers }).toPromise();
      this.customAlertService.show('Success', 'User restored successfully!');
      await this.fetchDeletedUsers();
    } catch (error) {
      console.error('Failed to restore user:', error);
      this.customAlertService.show('Error', 'Failed to restore user. Please try again.');
    } finally {
      this.isRestoring = false;
    }
  }

  protected readonly Math = Math;
}
