import { Routes } from '@angular/router';
import { OverviewComponent } from './Sections/overview/overview.component';

export const routes: Routes = [
  {
    title: "Overview",
    path: '',
    component: OverviewComponent
  },
  {
    title: "Stations",
    path: "stations",
    loadComponent: ()=> import("../app/Sections/stations/stations.component").then((m)=> m.StationsComponent)
  },
  {
    title: "Overview",
    path: '**',
    redirectTo: '/',
    // component: OverviewComponent
  }
];
