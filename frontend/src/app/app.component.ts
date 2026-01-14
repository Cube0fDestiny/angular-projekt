import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './core/user/user.service';
import { AuthService } from './core/auth/auth.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'orangular';
  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.initializeFromStorage();
  }

}
