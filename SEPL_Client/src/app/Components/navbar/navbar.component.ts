import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TimeViewerComponent } from '../time-viewer/time-viewer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, TimeViewerComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  routes:any = [
    // {
    //   name: "OVERVIEW",
    //   path: '/',
    // },
    {
      name: "STATIONS",
      path: '/stations',
    },
  ]
}
