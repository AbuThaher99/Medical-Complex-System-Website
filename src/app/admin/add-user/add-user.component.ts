import {Component, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import {NgForm} from '@angular/forms';
import {ConfigService} from '../../services/config.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css', './add-user-style.css']
})
export class AddUserComponent implements OnInit {
  @ViewChild('userForm') userForm!: NgForm;

  // Current wizard step
  currentStep: number = 1;

  // Loading state
  isSubmitting: boolean = false;

  // Password visibility toggle
  showPassword: boolean = false;

  // User data
  user: any = {
    password: '',
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    dateOfBirth: '',
    email: '',
    role: '',
    salary: {
      salaryType: 'MONTHLY',
      fixedSalary: 0,
      hourRate: 0,
      hourWork: 0
    }
  };

  doctor: any = {
    specialization: '',
    beginTime: '',
    endTime: ''
  };

  patient: any = {
    age: 0,
    bloodType: {id: 1}
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private customAlertService: CustomAlertService
  ) {
  }

  ngOnInit(): void {
    // Initialize with default values
    this.user.role = '';
    this.doctor.specialization = 'CARDIOLOGIST';
    this.doctor.beginTime = '09:00';
    this.doctor.endTime = '17:00';
  }

  // Navigate to next step
  nextStep(): void {
    if (this.canProceed()) {
      this.currentStep++;
    } else {
      // Mark all controls as touched to display validation errors
      this.validateCurrentStep();

      // Show alert for better UX
      this.customAlertService.show(
        'Validation Error',
        'Please fill in all required fields correctly before proceeding.'
      );
    }
  }

  // Navigate to previous step
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Check if can proceed to next step
  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.isStepOneValid();
      case 2:
        return this.isStepTwoValid();
      case 3:
        return this.isStepThreeValid();
      default:
        return true;
    }
  }

  // Validate current step fields
  validateCurrentStep(): void {
    // Implementation depends on form structure
    // This would mark all relevant fields as touched
    const form = this.userForm;
    if (form) {
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        if (control) {
          control.markAsTouched();
          control.markAsDirty();
        }
      });
    }
  }

  // Validation for Step 1
  isStepOneValid(): boolean {
    // Check if email is valid
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    const isEmailValid = this.user.email && emailPattern.test(this.user.email);

    // Check if password is valid (at least 8 characters)
    const isPasswordValid = this.user.password && this.user.password.length >= 8;

    // Check if role is selected
    const isRoleValid = this.user.role && this.user.role !== '';

    return isEmailValid && isPasswordValid && isRoleValid;
  }

  // Validation for Step 2
  isStepTwoValid(): boolean {
    return !!(
      this.user.firstName &&
      this.user.lastName &&
      this.user.dateOfBirth &&
      this.user.phone &&
      this.user.address
    );
  }

  // Validation for Step 3
  isStepThreeValid(): boolean {
    // If no role is selected, return false
    if (!this.user.role) return false;

    // Doctor validation
    if (this.user.role === 'DOCTOR') {
      return !!(
        this.doctor.specialization &&
        this.doctor.beginTime &&
        this.doctor.endTime
      );
    }

    // Patient validation
    if (this.user.role === 'PATIENT') {
      return this.patient.age > 0 && this.patient.bloodType.id > 0;
    }

    // Salary validation for staff roles
    if (this.user.role !== 'PATIENT') {
      if (this.user.salary.salaryType === 'MONTHLY') {
        return this.user.salary.fixedSalary > 0;
      } else if (this.user.salary.salaryType === 'HOURLY') {
        return this.user.salary.hourRate > 0 && this.user.salary.hourWork > 0;
      }
    }

    return true;
  }

  // Handle role change
  onRoleChange(): void {
    // Reset additional fields when role changes
    this.doctor = {
      specialization: 'CARDIOLOGIST',
      beginTime: '09:00',
      endTime: '17:00'
    };

    this.patient = {
      age: 0,
      bloodType: {id: 1}
    };

    // Set default salary type
    this.user.salary.salaryType = 'MONTHLY';
    this.user.salary.fixedSalary = 0;
    this.user.salary.hourRate = 0;
    this.user.salary.hourWork = 0;
  }

  // Password strength evaluation
  getPasswordStrength(password: string): string {
    if (!password) return '';

    // Basic password strength calculation
    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character type checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Return strength class
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  // Get password strength text
  getPasswordStrengthText(password: string): string {
    const strength = this.getPasswordStrength(password);

    switch (strength) {
      case 'weak':
        return 'Weak password - add numbers and special characters';
      case 'medium':
        return 'Medium strength - try adding special characters';
      case 'strong':
        return 'Strong password';
      default:
        return '';
    }
  }

  // Get role display name
  getRoleName(roleCode: string): string {
    switch (roleCode) {
      case 'ADMIN':
        return 'Administrator';
      case 'DOCTOR':
        return 'Doctor';
      case 'SECRETARY':
        return 'Secretary';
      case 'WAREHOUSE_EMPLOYEE':
        return 'Warehouse Employee';
      case 'PATIENT':
        return 'Patient';
      default:
        return roleCode;
    }
  }

  // Get blood type display name
  getBloodTypeName(id: number): string {
    switch (id) {
      case 1:
        return 'A+';
      case 2:
        return 'A-';
      case 3:
        return 'B+';
      case 4:
        return 'B-';
      case 5:
        return 'O+';
      case 6:
        return 'O-';
      case 7:
        return 'AB+';
      case 8:
        return 'AB-';
      default:
        return 'Unknown';
    }
  }

  // Form submission
  onSubmit(): void {
    this.isSubmitting = true;
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      this.customAlertService.show('Error', 'You are not logged in. Please log in first.');
      this.isSubmitting = false;
      return;
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    // Prepare the user object based on the selected role
    let requestBody: any;

    switch (this.user.role) {
      case 'DOCTOR':
        // Send time as string for proper LocalTime deserialization
        // The format should be HH:MM:SS for Java LocalTime
        const beginTime = this.doctor.beginTime.includes(':') ?
          this.doctor.beginTime : `${this.doctor.beginTime}:00`;

        const endTime = this.doctor.endTime.includes(':') ?
          this.doctor.endTime : `${this.doctor.endTime}:00`;

        // Make sure we have seconds included
        const formattedBeginTime = beginTime.split(':').length === 2 ?
          `${beginTime}:00` : beginTime;

        const formattedEndTime = endTime.split(':').length === 2 ?
          `${endTime}:00` : endTime;

        // Create a copy of user without the salary field (we'll add it properly later)
        const userCopy = {...this.user};
        delete userCopy.salary;

        requestBody = {
          specialization: this.doctor.specialization,
          beginTime: formattedBeginTime,
          endTime: formattedEndTime,
          user: userCopy
        };
        break;
      case 'PATIENT':
        requestBody = {
          age: this.patient.age,
          user: {...this.user},
          bloodType: {...this.patient.bloodType}
        };
        break;
      default:
        // For other roles (ADMIN, SECRETARY, WAREHOUSE_EMPLOYEE)
        requestBody = {...this.user};
        break;
    }

    // Adjust the salary object based on the selected salary type
    if (this.user.role !== 'PATIENT') {
      // Create salary object with correct format for all roles
      let salaryObject;

      if (this.user.salary.salaryType === 'MONTHLY') {
        salaryObject = {
          salaryType: 'MONTHLY',
          fixedSalary: this.user.salary.fixedSalary || 0,
          salaryAmount: 0
        };
      } else {
        salaryObject = {
          salaryType: 'HOURLY',
          hourRate: this.user.salary.hourRate || 0,
          hourWork: this.user.salary.hourWork || 0
        };
      }

      // Apply this salary object to the right place in the request
      if (this.user.role === 'DOCTOR') {
        // For doctors, salary needs to be part of the user object
        requestBody.user.salary = salaryObject;
      } else {
        // For other roles, salary is a direct property
        requestBody.salary = salaryObject;
      }
    }

    // Determine the API endpoint based on the role
    let url = '';
    const baseUrl = this.configService.apiUrl;

    switch (this.user.role) {
      case 'DOCTOR':
        url = `${baseUrl}admin/doctors/`;
        break;
      case 'PATIENT':
        url = `${baseUrl}auth`;
        break;
      default:
        url = `${baseUrl}admin/user/`;
        break;
    }

    // Make the POST request
    this.http.post(url, requestBody, {headers}).subscribe({
      next: (response) => {
        console.log('User added successfully:', response);
        this.customAlertService.show('Success', 'User added successfully.');
        setTimeout(() => {
          this.router.navigate(['/admin/manageuser']);
        }, 3000);
      },
      error: (error) => {
        console.error('Failed to add user:', error);
        let errorMessage = 'Failed to add user. Please try again.';

        // Try to extract more specific error message if available
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.customAlertService.show('Error', errorMessage);
        this.isSubmitting = false;
      },
      complete: () => {
        // This won't run if there's an error
        this.isSubmitting = false;
      }
    });
  }
}
