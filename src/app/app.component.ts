import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './core/services/user.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'orangular';
  constructor(private userService: UserService) {}
  
  ngOnInit() {
    // Load current user when app starts
    this.userService.initializeWithMockData();
    
    // Or load from localStorage/API:
    // const savedUser = localStorage.getItem('currentUser');
    // if (savedUser) this.userService.setCurrentUser(JSON.parse(savedUser));
  }
}
