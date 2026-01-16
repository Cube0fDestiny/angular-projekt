import { CommonModule } from '@angular/common';
import { TextDisplayComponent } from '../../shared/components/text-display/text-display.component';
import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { UserService } from '../../core/user/user.service';
import { FormsModule } from '@angular/forms';
import { OrangButtonComponent } from '../../shared/components/orang-button/orang-button.component';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    TextDisplayComponent,
    OrangButtonComponent,
    FormsModule
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  /** Current logged-in user */
  currentUser!: User | null;

  isEditingName = false;
  editedName = '';
  isEditingSurname = false;
  editedSurname = '';
  isEditingEmail = false;
  editedEmail = '';
  isEditingPassword = false;
  editedPassword = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => this.currentUser = user);
  }

  // --- Name Methods ---
  toggleEditingName(): void {
    this.isEditingName = !this.isEditingName;
    if (this.isEditingName) {
      this.editedName = this.currentUser?.name || '';
    }
  }

  updateName(): void {
    if (!this.currentUser) return;
    
    if (!this.editedName?.trim() || this.editedName === this.currentUser.name) {
      this.isEditingName = false;
      return;
    }
    
    const updatedProfile = {
      name: this.editedName
    };

    this.userService.updateProfile(this.currentUser.id, updatedProfile).subscribe({
      next: () => {
        this.currentUser!.name = this.editedName;
        console.log('Successfully updated name');
        this.isEditingName = false;
      },
      error: (error) => {
        console.error('Failed to update name:', error);
        this.isEditingName = false;
      }
    });
  }

  // --- Surname Methods ---
  toggleEditingSurname(): void {
    this.isEditingSurname = !this.isEditingSurname;
    if (this.isEditingSurname) {
      this.editedSurname = this.currentUser?.surname || '';
    }
  }

  updateSurname(): void {
    if (!this.currentUser) return;
    
    if (!this.editedSurname?.trim() || this.editedSurname === this.currentUser.surname) {
      this.isEditingSurname = false;
      return;
    }
    
    const updatedProfile = {
      surname: this.editedSurname
    };

    this.userService.updateProfile(this.currentUser.id, updatedProfile).subscribe({
      next: () => {
        this.currentUser!.surname = this.editedSurname;
        console.log('Successfully updated surname');
        this.isEditingSurname = false;
      },
      error: (error) => {
        console.error('Failed to update surname:', error);
        this.isEditingSurname = false;
      }
    });
  }

  // --- Email Methods ---
  toggleEditingEmail(): void {
    this.isEditingEmail = !this.isEditingEmail;
    if (this.isEditingEmail) {
      this.editedEmail = this.currentUser?.email || '';
    }
  }

  updateEmail(): void {
    if (!this.currentUser) return;
    
    if (!this.editedEmail?.trim() || this.editedEmail === this.currentUser.email) {
      this.isEditingEmail = false;
      return;
    }
    
    const updatedProfile = {
      email: this.editedEmail
    };

    this.userService.updateProfile(this.currentUser.id, updatedProfile).subscribe({
      next: () => {
        this.currentUser!.email = this.editedEmail;
        console.log('Successfully updated email');
        this.isEditingEmail = false;
      },
      error: (error) => {
        console.error('Failed to update email:', error);
        this.isEditingEmail = false;
      }
    });
  }

  // --- Password Methods ---
  toggleEditingPassword(): void {
    this.isEditingPassword = !this.isEditingPassword;
    if (this.isEditingPassword) {
      this.editedPassword = '';
    }
  }
  /*
  updatePassword(): void {
    if (!this.currentUser) return;
    
    if (!this.editedPassword?.trim()) {
      this.isEditingPassword = false;
      return;
    }
    
    // Note: You'll need a separate endpoint for password changes
    // This is just the structure
    const updatedProfile = {
      password: this.editedPassword
    };

    this.userService.updateProfile(this.currentUser.id, updatedProfile).subscribe({
      next: () => {
        console.log('Successfully updated password');
        this.editedPassword = '';
        this.isEditingPassword = false;
      },
      error: (error) => {
        console.error('Failed to update password:', error);
        this.isEditingPassword = false;
      }
    });
  }
    */
}