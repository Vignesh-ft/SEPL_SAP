import { Routes } from '@angular/router';
import { OverviewComponent } from './Sections/overview/overview.component';
import { StationsComponent } from '../app/Sections/stations/stations.component';

export const routes: Routes = [
  {
    title: "Stations",
    path: '',
    component: StationsComponent
  },
  {
    title: "Stations",
    path: "stations",
    loadComponent: ()=> import("../app/Sections/stations/stations.component").then((m)=> m.StationsComponent)
  },
  {
    title: "Stations",
    path: '**',
    redirectTo: '/',
    // component: OverviewComponent
  }
];
